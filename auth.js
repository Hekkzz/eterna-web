document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.getElementById("btn-login");
  const btnRegister = document.getElementById("btn-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const registerFields = document.getElementById("register-fields");
  const userType = document.getElementById("user-type");

  // Cambiar pestañas
  btnLogin.addEventListener("click", () => {
    btnLogin.classList.add("active");
    btnRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  });

  btnRegister.addEventListener("click", () => {
    btnRegister.classList.add("active");
    btnLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  });

  // Mostrar campos dependiendo del tipo de usuario
  userType.addEventListener("change", () => {
    const type = userType.value;
    registerFields.innerHTML = "";

    if (type === "anciano") {
      registerFields.innerHTML = `
        <input type="text" placeholder="Nombre completo" required>
        <input type="text" placeholder="Edad">
        <textarea placeholder="Enfermedades o cuidados especiales"></textarea>
        <input type="text" placeholder="Usuario" required>
        <input type="password" placeholder="Contraseña (8 dígitos)" minlength="8" required>
      `;
    } else if (type === "cuidador") {
      registerFields.innerHTML = `
        <input type="text" placeholder="Nombre completo" required>
        <input type="text" placeholder="Profesión / Especialidad">
        <textarea placeholder="Aptitudes y experiencia"></textarea>
        <input type="number" placeholder="Costo por hora (MXN)">
        <input type="text" placeholder="Horarios disponibles">
        <input type="text" placeholder="Usuario" required>
        <input type="password" placeholder="Contraseña (8 dígitos)" minlength="8" required>
      `;
    }
  });

  // Login simulado
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("login-user").value;
    const pass = document.getElementById("login-pass").value;

    // Ejemplo: decidir el tipo según prefijo
    if (user.startsWith("anciano")) {
      window.location.href = "anciano.html";
    } else if (user.startsWith("cuidador")) {
      window.location.href = "cuidador.html";
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  });
});
