const registerForm = document.getElementById("register-form");
const errorMessage = document.getElementById("error-message");
const btnText = document.getElementById("btn-text");
const spinner = document.getElementById("spinner");
const submitBtn = document.getElementById("submit-btn");

registerForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  try {
    // Get form values
    const fullName =
      document.getElementById("fullname")?.value.split(" ") || [];
    const nom = fullName[0] || "";
    const prenom = fullName.slice(1).join(" ");
    const email = document.getElementById("email")?.value;
    const telephone = document.getElementById("tel")?.value;
    const password = document.getElementById("password")?.value;
    const confirmPassword = document.getElementById("confirm-password")?.value;
    const filiere = document.getElementById("level")?.value;
    const accountType = document.getElementById("accountType")?.value;

    // Validation des champs requis
    if (!email || !password || !confirmPassword || !filiere || !accountType) {
      showError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (password !== confirmPassword) {
      showError("Les mots de passe ne correspondent pas");
      return;
    }

    // Show loading state
    btnText.textContent = "Création du compte...";
    spinner.classList.remove("hidden");
    submitBtn.disabled = true;

    // Préparer les données pour l'API
    const userData = {
      nom: nom,
      prenom: prenom,
      email: email,
      mot_de_passe: password,
      telephone: telephone,
      matricule: email.split("@")[0].toUpperCase(),
      filiere: filiere,
      role: accountType,
    };

    // Envoyer les données à l'API
    const response = await fetch("http://localhost:3000/api/utilisateurs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de l'inscription");
    }

    // Redirection en fonction du rôle
    if (accountType === "Vendeur") {
      window.location.href = "../acheteur.html";
    } else {
      window.location.href = "connection.html?success=1";
    }
  } catch (error) {
    console.error("Erreur:", error);
    showError(error.message);
  } finally {
    btnText.textContent = "Créer mon compte";
    spinner.classList.add("hidden");
    submitBtn.disabled = false;
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
  setTimeout(() => {
    errorMessage.classList.add("hidden");
  }, 5000);
}
