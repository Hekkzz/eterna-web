// auth.js
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Esperar a que Firebase esté inicializado
function waitForFirebase() {
  return new Promise((resolve) => {
    const checkFirebase = setInterval(() => {
      if (window.firebaseAuth && window.firebaseDB) {
        clearInterval(checkFirebase);
        resolve();
      }
    }, 100);
  });
}

// Convertir archivo a Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Validar tamaño de archivo (máximo 800KB para Base64)
function validateFileSize(file, maxSizeKB = 800) {
  const maxSize = maxSizeKB * 1024;
  if (file.size > maxSize) {
    throw new Error(`El archivo "${file.name}" es muy grande. Máximo ${maxSizeKB}KB (menos de 1MB).`);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await waitForFirebase();
  
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

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

  // Campos dinámicos según tipo
  userType.addEventListener("change", () => {
    const type = userType.value;
    registerFields.innerHTML = "";

    if (type === "anciano") {
      registerFields.innerHTML = `
        <input type="text" id="nombre" placeholder="Nombre completo" required>
        <input type="text" id="curp" placeholder="CURP (18 caracteres)" maxlength="18" required>
        <input type="tel" id="telefono" placeholder="Teléfono (10 dígitos)" maxlength="10" pattern="[0-9]{10}" required>
        <input type="number" id="edad" placeholder="Edad" min="1" max="120" required>
        <textarea id="cuidados" placeholder="Enfermedades o cuidados especiales (opcional)"></textarea>
        
        <label class="file-label">📄 Historial Clínico (Opcional - máx 800KB)</label>
        <input type="file" id="historial" accept=".pdf,.jpg,.jpeg,.png">
        <small>Puedes subirlo después en tu panel</small>
        
        <input type="email" id="correo" placeholder="Correo electrónico" required>
        <input type="password" id="pass" placeholder="Contraseña (mínimo 8 caracteres)" minlength="8" required>
      `;
    } else if (type === "cuidador") {
      registerFields.innerHTML = `
        <input type="text" id="nombre" placeholder="Nombre completo" required>
        <input type="text" id="curp" placeholder="CURP (18 caracteres)" maxlength="18" required>
        <input type="tel" id="telefono" placeholder="Teléfono (10 dígitos)" maxlength="10" pattern="[0-9]{10}" required>
        <input type="text" id="profesion" placeholder="Profesión / Especialidad" required>
        <textarea id="experiencia" placeholder="Aptitudes y experiencia" required></textarea>
        <input type="number" id="costo" placeholder="Costo por hora (MXN)" min="0" required>
        <input type="text" id="horario" placeholder="Ej: Lunes a Viernes 9am-5pm" required>
        
        <label class="file-label">📎 Foto de perfil (Opcional - máx 500KB)</label>
        <input type="file" id="foto-perfil" accept=".jpg,.jpeg,.png">
        <small>Una foto ayuda a generar más confianza</small>
        
        <label class="file-label">📋 Antecedentes No Penales (Opcional - máx 800KB)</label>
        <input type="file" id="antecedentes" accept=".pdf,.jpg,.jpeg,.png">
        <small>Documento de constancia de no antecedentes penales</small>
        
        <input type="email" id="correo" placeholder="Correo electrónico" required>
        <input type="password" id="pass" placeholder="Contraseña (mínimo 8 caracteres)" minlength="8" required>
      `;
    }
  });

  // === REGISTRO ===
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const type = userType.value;
    if (!type) {
      alert("Por favor selecciona un tipo de usuario");
      return;
    }

    const email = document.getElementById("correo").value.trim();
    const password = document.getElementById("pass").value;
    const nombre = document.getElementById("nombre").value.trim();
    const curp = document.getElementById("curp").value.trim().toUpperCase();

    // Validaciones
    if (password.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (curp.length !== 18) {
      alert("El CURP debe tener exactamente 18 caracteres");
      return;
    }

    const telefono = document.getElementById("telefono").value.trim();
    if (telefono.length !== 10 || !/^\d{10}$/.test(telefono)) {
      alert("El teléfono debe tener exactamente 10 dígitos");
      return;
    }

    // Deshabilitar botón de submit
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Registrando...";

    try {
      // 1. Crear usuario en Firebase Authentication
      console.log("Creando usuario en Authentication...");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      console.log("Usuario creado con UID:", uid);

      // 2. Preparar datos básicos para Firestore - ASEGURAR QUE TELEFONO EXISTE
      const data = { 
        tipo: type, 
        email: email,
        nombre: nombre,
        curp: curp,
        telefono: telefono, // CRÍTICO: asegurar que siempre exista
        fechaRegistro: new Date().toISOString(),
        activo: true
      };

      // 3. Procesar según el tipo de usuario
      if (type === "anciano") {
        const edadInput = document.getElementById("edad");
        const cuidadosInput = document.getElementById("cuidados");
        
        data.edad = edadInput ? parseInt(edadInput.value) : 0;
        data.cuidados = cuidadosInput ? (cuidadosInput.value.trim() || "Ninguno especificado") : "Ninguno especificado";
        
        // Guardar historial clínico como Base64 (OPCIONAL)
        const historialFile = document.getElementById("historial")?.files[0];
        if (historialFile) {
          try {
            validateFileSize(historialFile, 800); // Máximo 800KB
            submitBtn.textContent = "Procesando historial...";
            const historialBase64 = await fileToBase64(historialFile);
            
            // Crear documento separado para el historial (evita límite de 1MB en el documento principal)
            await setDoc(doc(db, "archivos", uid), {
              userId: uid,
              tipo: "historial",
              historialBase64: historialBase64,
              historialNombre: historialFile.name,
              historialTipo: historialFile.type,
              fechaSubida: new Date().toISOString()
            });
            
            data.tieneHistorial = true;
            data.historialNombre = historialFile.name;
            console.log("Historial guardado exitosamente");
          } catch (uploadError) {
            console.warn("Error al guardar historial:", uploadError);
            alert(uploadError.message || "Error al procesar el historial. Puedes subirlo después.");
            data.tieneHistorial = false;
          }
        } else {
          data.tieneHistorial = false;
        }
        
      } else if (type === "cuidador") {
        const profesionInput = document.getElementById("profesion");
        const experienciaInput = document.getElementById("experiencia");
        const costoInput = document.getElementById("costo");
        const horarioInput = document.getElementById("horario");
        
        data.profesion = profesionInput ? profesionInput.value.trim() : "No especificado";
        data.experiencia = experienciaInput ? experienciaInput.value.trim() : "No especificado";
        data.costo = costoInput ? parseFloat(costoInput.value) : 0;
        data.horario = horarioInput ? horarioInput.value.trim() : "No especificado";
        data.disponible = true;
        data.calificacion = 0;
        data.numeroCalificaciones = 0;
        
        // Guardar foto de perfil como Base64 (OPCIONAL)
        const fotoFile = document.getElementById("foto-perfil")?.files[0];
        if (fotoFile) {
          try {
            validateFileSize(fotoFile, 500); // Máximo 500KB para fotos
            submitBtn.textContent = "Procesando foto...";
            const fotoBase64 = await fileToBase64(fotoFile);
            data.fotoPerfil = fotoBase64;
            data.fotoNombre = fotoFile.name;
            console.log("Foto de perfil guardada exitosamente");
          } catch (uploadError) {
            console.warn("Error al guardar foto:", uploadError);
            alert(uploadError.message || "Error al procesar la foto. Puedes subirla después.");
            data.fotoPerfil = null;
          }
        } else {
          data.fotoPerfil = null;
        }

        // Guardar antecedentes no penales (OPCIONAL)
        const antecedentesFile = document.getElementById("antecedentes")?.files[0];
        if (antecedentesFile) {
          try {
            validateFileSize(antecedentesFile, 800);
            submitBtn.textContent = "Procesando antecedentes...";
            const antecedentesBase64 = await fileToBase64(antecedentesFile);
            
            // Crear documento separado para antecedentes
            await setDoc(doc(db, "documentos", uid), {
              userId: uid,
              tipo: "antecedentes",
              antecedentesBase64: antecedentesBase64,
              antecedentesNombre: antecedentesFile.name,
              antecedentesTipo: antecedentesFile.type,
              fechaSubida: new Date().toISOString()
            });
            
            data.tieneAntecedentes = true;
            data.antecedentesNombre = antecedentesFile.name;
            console.log("Antecedentes guardados exitosamente");
          } catch (uploadError) {
            console.warn("Error al guardar antecedentes:", uploadError);
            alert(uploadError.message || "Error al procesar los antecedentes. Puedes subirlos después.");
            data.tieneAntecedentes = false;
          }
        } else {
          data.tieneAntecedentes = false;
        }
      }

      // 4. Guardar en Firestore
      submitBtn.textContent = "Guardando datos...";
      console.log("Guardando datos en Firestore:", data);
      await setDoc(doc(db, "usuarios", uid), data);
      console.log("Datos guardados exitosamente");

      // 5. Guardar tipo en localStorage y redirigir
      localStorage.setItem("userType", type);
      localStorage.setItem("userId", uid);
      
      alert("¡Registro exitoso! Redirigiendo a tu panel...");
      window.location.href = `${type}.html`;

    } catch (error) {
      console.error("Error completo:", error);
      
      let errorMessage = "Error al registrar: ";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este correo ya está registrado. Intenta iniciar sesión.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña es muy débil. Usa al menos 8 caracteres con letras y números.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "El formato del correo electrónico no es válido.";
      } else if (error.code === "permission-denied") {
        errorMessage = "Error de permisos. Verifica la configuración de Firebase.";
      } else if (error.message.includes("muy grande")) {
        errorMessage = error.message;
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      
      // Rehabilitar botón
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // === LOGIN ===
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("login-user").value.trim();
    const password = document.getElementById("login-pass").value;

    if (!email || !password) {
      alert("Por favor completa todos los campos");
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Iniciando sesión...";

    try {
      console.log("Autenticando usuario...");
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      console.log("Usuario autenticado con UID:", uid);

      console.log("Obteniendo datos de Firestore...");
      const userDocRef = doc(db, "usuarios", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const tipo = userData.tipo;
        
        console.log("Datos de usuario obtenidos:", userData);
        
        // VERIFICAR Y CORREGIR DATOS FALTANTES
        if (!userData.telefono) {
          console.warn("Usuario sin teléfono registrado");
          alert("Tu perfil está incompleto. Por favor actualiza tu información en el panel.");
        }
        
        localStorage.setItem("userType", tipo);
        localStorage.setItem("userId", uid);
        localStorage.setItem("userName", userData.nombre);
        
        console.log("Redirigiendo a:", `${tipo}.html`);
        window.location.href = `${tipo}.html`;
      } else {
        console.error("No se encontró el documento del usuario en Firestore");
        alert("Error: No se encontró información del usuario. Por favor contacta al soporte.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Entrar";
      }

    } catch (error) {
      console.error("Error completo al iniciar sesión:", error);
      
      let errorMessage = "Error al iniciar sesión: ";
      
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        errorMessage = "Correo o contraseña incorrectos.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No existe una cuenta con este correo.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Demasiados intentos fallidos. Intenta más tarde.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Error de conexión. Verifica tu internet.";
      } else if (error.code === "permission-denied") {
        errorMessage = "Error de permisos en Firestore. Verifica la configuración de reglas.";
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      
      submitBtn.disabled = false;
      submitBtn.textContent = "Entrar";
    }
  });
});