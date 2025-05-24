// Ajoutez ceci dans votre section script existante
document.addEventListener("DOMContentLoaded", function () {
  // ...existing code...

  let currentPanel = 1;
  const totalPanels = 4;
  
  // Afficher le premier panel au chargement
  document.querySelector('.panel_1').classList.add('active');
  
  // Fonction pour mettre à jour les indicateurs d'étapes
  function updateSteps(current) {
    document.querySelectorAll('.step').forEach((step, index) => {
      if (index + 1 < current) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (index + 1 === current) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
  }
  
  // Fonction pour valider chaque étape
  function validatePanel(panelNumber) {
    const panel = document.querySelector(`.panel_${panelNumber}`);
    const inputs = panel.querySelectorAll('input, select');
    let isValid = true;
    
    inputs.forEach(input => {
      if (input.required && !input.value) {
        isValid = false;
        input.classList.add('border-red-500');
      } else {
        input.classList.remove('border-red-500');
      }
    });
    
    return isValid;
  }
  
  // Gérer les boutons "Suivant"
  document.querySelectorAll('.next-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validatePanel(currentPanel)) {
        document.querySelector(`.panel_${currentPanel}`).classList.remove('active');
        currentPanel++;
        document.querySelector(`.panel_${currentPanel}`).classList.add('active');
        updateSteps(currentPanel);
      } else {
        showError('Veuillez remplir tous les champs requis');
      }
    });
  });
  
  // Gérer les boutons "Précédent"
  document.querySelectorAll('.prev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector(`.panel_${currentPanel}`).classList.remove('active');
      currentPanel--;
      document.querySelector(`.panel_${currentPanel}`).classList.add('active');
      updateSteps(currentPanel);
    });
  });
  
  // Modifier la gestion du formulaire
  const form = document.getElementById('register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validatePanel(currentPanel)) {
      // Votre code existant pour l'envoi du formulaire
    } else {
      showError('Veuillez remplir tous les champs requis');
    }
  });
});