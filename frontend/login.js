document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const errorMessage = document.getElementById("error-message");
  const btnText = document.getElementById("btn-text");
  const spinner = document.getElementById("spinner");
  const submitBtn = document.getElementById("submit-btn");

  if (!loginForm) {
    console.error("Le formulaire de connexion n'a pas été trouvé");
    return;
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
      // Afficher le spinner et désactiver le bouton
      if (spinner && btnText && submitBtn) {
        spinner.classList.remove("hidden");
        btnText.textContent = "Connexion en cours...";
        submitBtn.disabled = true;
      }

      // Récupérer les valeurs du formulaire
      const email = document.getElementById("email")?.value;
      const password = document.getElementById("password")?.value;

      // Validation basique
      if (!email || !password) {
        throw new Error("Veuillez remplir tous les champs");
      }

      // Appel à l'API
      const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"  // Ajout de l'en-tête Accept
            },
            body: JSON.stringify({ email, password }),
            credentials: "include",
        });
// Vérifier le type de contenu de la réponse
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La réponse du serveur n'est pas au format JSON");
        }
      let data;
    try {
        data = await response.json();
    } catch (jsonError) {
        console.error("Erreur de parsing JSON:", jsonError);
        throw new Error("Format de réponse invalide du serveur");
    }

    if (!response.ok) {
        throw new Error(data.message || "Erreur de connexion");
    }

      if (!response.ok) {
        throw new Error(data.message || "Erreur de connexion");
      }

      // Stocker le token si nécessaire
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Redirection selon le type de compte
      if (data.user.accountType === "admin") {
        window.location.href = "/admin/dashboard.html";
      } else {
        window.location.href = "/dashboard.html";
      }
    } catch (error) {
      console.error("Erreur détaillée:", error);
      showError(error.message);
    } finally {
      // Restaurer l'état du bouton
      if (spinner && btnText && submitBtn) {
        spinner.classList.add("hidden");
        btnText.textContent = "Se connecter";
        submitBtn.disabled = false;
      }
    }
  });

  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.remove("hidden");
      setTimeout(() => {
        errorMessage.classList.add("hidden");
      }, 5000);
    }
  }
});
