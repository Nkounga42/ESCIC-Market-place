const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express(); 


let origin = ["http://127.0.0.1:5500", "http://localhost:5500"]
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: origin,
        methods: ["GET", "POST"],
        credentials: true
    }
});









const APPMail = "hachetag42@gmail.com"
// 1. Middlewares de base
app.use(express.json());


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: APPMail, // Remplacez par votre email
        pass: 'yekq icts znnj cnwj' // Utilisez un mot de passe d'application Google
    }
});

// Ajoutez cette vérification après la configuration
transporter.verify(function(error, success) {
    if (error) {
        console.log("Erreur de configuration email:", error);
    } else {
        console.log("Serveur prêt à envoyer des emails");
    }
});

// 2. Configuration CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));


// Configuration de la connexion MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '117Gv12Cg',
  database: 'escic_market_place'
});

// Connexion à MySQL
connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à MySQL:', err);
    return;
  }
  console.log('Connecté à la base de données MySQL');
});

// Route racine
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API ESCIC Market' });
});

// Route pour obtenir tous les utilisateurs avec leurs rôles
app.get('/api/utilisateurs', (req, res) => {
  const query = `
    SELECT u.*, GROUP_CONCAT(r.nom_role) as roles 
    FROM utilisateurs u 
    LEFT JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id 
    LEFT JOIN roles r ON ur.role_id = r.id 
    GROUP BY u.id
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'exécution de la requête:', err);
      res.status(500).json({ error: 'Erreur de base de données' });
      return;
    }
    res.json(results);
  });
});

// Route pour obtenir un utilisateur par ID avec ses rôles
app.get('/api/utilisateurs/:id', (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT u.*, GROUP_CONCAT(r.nom_role) as roles 
    FROM utilisateurs u 
    LEFT JOIN utilisateur_roles ur ON u.id = ur.utilisateur_id 
    LEFT JOIN roles r ON ur.role_id = r.id 
    WHERE u.id = ?
    GROUP BY u.id
  `;
  
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'exécution de la requête:', err);
      res.status(500).json({ error: 'Erreur de base de données' });
      return;
    }
    
    if (results.length === 0) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }
    
    res.json(results[0]);
  });
});

// Route pour créer un nouvel utilisateur
app.post('/api/utilisateurs', async (req, res) => {
  const { nom, prenom, email, mot_de_passe, telephone, matricule, filiere } = req.body;
  
  try {
    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    
    // Début de la transaction
    connection.beginTransaction(async (err) => {
      if (err) throw err;

      try {
        // Création de l'utilisateur
        const insertUserQuery = 'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, matricule, filiere) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [userResult] = await connection.promise().query(insertUserQuery, [
          nom, prenom, email, hashedPassword, telephone, matricule, filiere
        ]);

        // Récupération de l'ID du rôle 'acheteur'
        const [roleResult] = await connection.promise().query(
          'SELECT id FROM roles WHERE nom_role = ?', 
          ['acheteur']
        );

        // Attribution du rôle acheteur
        await connection.promise().query(
          'INSERT INTO utilisateur_roles (utilisateur_id, role_id) VALUES (?, ?)',
          [userResult.insertId, roleResult[0].id]
        );

        // Validation de la transaction
        connection.commit((err) => {
          if (err) throw err;
          res.status(201).json({
            message: 'Utilisateur créé avec succès',
            id: userResult.insertId
          });
        });

      } catch (error) {
        // Annulation de la transaction en cas d'erreur
        connection.rollback(() => {
          console.error('Erreur lors de la création de l\'utilisateur:', error);
          if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Cette adresse email est déjà utilisée' });
          } else {
            res.status(500).json({ error: 'Erreur de base de données' });
          }
        });
      }
    });

  } catch (error) {
    console.error('Erreur lors du hachage du mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// Route de connexion
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const [users] = await connection.promise().query(
            'SELECT * FROM utilisateurs WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const user = users[0];

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.mot_de_passe);
        if (!validPassword) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Retourner les informations de l'utilisateur
        res.json({
            message: 'Connexion réussie',
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom,
                accountType: user.type_compte || 'user'
            }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Vérifier si l'email existe
        const [users] = await connection.promise().query(
            'SELECT * FROM utilisateurs WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                message: 'Aucun compte n\'est associé à cet email' 
            });
        }

        // Générer un code à 6 chiffres au lieu d'un token
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetCodeExpiry = new Date(Date.now() + 3600000); // 1 heure

        // Sauvegarder le code dans la base de données
        await connection.promise().query(
            'UPDATE utilisateurs SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
            [resetCode, resetCodeExpiry, email]
        );

        // Préparer et envoyer l'email
        const mailOptions = {
            from: APPMail,
            to: email,
            subject: 'Code de réinitialisation - ESCIC Market',
            html: `
                <h1>Réinitialisation de mot de passe</h1>
                <p>Voici votre code de réinitialisation : <strong>${resetCode}</strong></p>
                <p>Ce code expirera dans 1 heure.</p>
                <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.json({ 
            message: 'Un code de réinitialisation a été envoyé à votre adresse email' 
        });

    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        res.status(500).json({ 
            message: 'Une erreur est survenue lors de la réinitialisation' 
        });
    }
});

// Route pour vérifier le code de réinitialisation
app.post('/api/auth/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        // Vérifier si l'utilisateur existe avec ce code
        const [users] = await connection.promise().query(
            'SELECT * FROM utilisateurs WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()',
            [email, code]
        );

        if (users.length === 0) {
            return res.status(400).json({ 
                message: 'Code invalide ou expiré' 
            });
        }

        // Code valide, on peut autoriser la réinitialisation
        res.json({ 
            message: 'Code vérifié avec succès',
            valid: true
        });

    } catch (error) {
        console.error('Erreur lors de la vérification du code:', error);
        res.status(500).json({ 
            message: 'Une erreur est survenue lors de la vérification' 
        });
    }
});

// Route pour réinitialiser le mot de passe
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe et a un code valide
        const [users] = await connection.promise().query(
            'SELECT * FROM utilisateurs WHERE email = ? AND reset_token IS NOT NULL AND reset_token_expiry > NOW()',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ 
                message: 'Session de réinitialisation invalide ou expirée' 
            });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Mettre à jour le mot de passe et réinitialiser le token
        await connection.promise().query(
            'UPDATE utilisateurs SET mot_de_passe = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?',
            [hashedPassword, email]
        );

        res.json({ 
            message: 'Mot de passe réinitialisé avec succès' 
        });

    } catch (error) {
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
        res.status(500).json({ 
            message: 'Une erreur est survenue lors de la réinitialisation' 
        });
    }
});


// Route pour mettre à jour un utilisateur
app.put('/api/utilisateurs/:id', (req, res) => {
  const id = req.params.id;
  const { nom, prenom, email, telephone, filiere } = req.body;
  
  const query = 'UPDATE utilisateurs SET nom = ?, prenom = ?, email = ?, telephone = ?, filiere = ? WHERE id = ?';
  
  connection.query(query, [nom, prenom, email, telephone, filiere, id], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
      res.status(500).json({ error: 'Erreur de base de données' });
      return;
    }
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }
    
    res.json({ message: 'Utilisateur mis à jour avec succès' });
  });
});


// Route pour créer une nouvelle demande
app.post('/api/demandes', (req, res) => {
  const { utilisateur_id, type_demande, contenu } = req.body;
  
  const query = 'INSERT INTO demandes (utilisateur_id, type_demande, contenu) VALUES (?, ?, ?)';
  
  connection.query(query, [utilisateur_id, type_demande, contenu], (err, result) => {
    if (err) {
      console.error('Erreur lors de la création de la demande:', err);
      res.status(500).json({ error: 'Erreur de base de données' });
      return;
    }
    
    res.status(201).json({
      message: 'Demande créée avec succès',
      id: result.insertId
    });
  });
});


//! ///////////////////////////////////////////////////////////////////
//! ///////////////////////////////////////////////////////////////////
//! ///////////////////////////////////////////////////////////////////
//! ///////////////////////////////////////////////////////////////////
//! ///////////////////////////////////////////////////////////////////
//! ///////////////////////////////////////////////////////////////////
//! ///////////////////////////////////////////////////////////////////
//! ///////////////////////////////////////////////////////////////////
//! ///////////////////////////////////////////////////////////////////
//! ///////////////////////////////////////////////////////////////////



// Route de connexion super admin
app.post('/api/auth/super-admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe et est un super admin
        const [users] = await connection.promise().query(
            'SELECT * FROM utilisateurs WHERE email = ? AND type_compte = "super_admin"',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                message: 'Accès non autorisé' 
            });
        }

        const user = users[0];

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.mot_de_passe);
        if (!validPassword) {
            return res.status(401).json({ 
                message: 'Email ou mot de passe incorrect' 
            });
        }

        // Vérifications supplémentaires pour super admin si nécessaire
        const [adminRights] = await connection.promise().query(
            'SELECT r.nom_role FROM utilisateur_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.utilisateur_id = ? AND r.nom_role = "super_admin"',
            [user.id]
        );

        if (adminRights.length === 0) {
            return res.status(403).json({ 
                message: 'Privilèges insuffisants' 
            });
        }

        // Retourner les informations du super admin
        res.json({
            message: 'Connexion super admin réussie',
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom,
                type_compte: 'super_admin',
                permissions: ['ALL']  // Liste des permissions spéciales
            }
        });

    } catch (error) {
        console.error('Erreur lors de la connexion super admin:', error);
        res.status(500).json({ 
            message: 'Erreur serveur' 
        });
    }
});






// Ajouter à la fin du fichier, avant app.listen
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({
        message: 'Une erreur est survenue sur le serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});