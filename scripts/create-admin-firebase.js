// Node script que usa Firebase Admin SDK para criar um usuário admin e setar custom claims.
// Requisitos: colocar o arquivo serviceAccountKey.json na raiz ou apontar via GOOGLE_APPLICATION_CREDENTIALS
const admin = require('firebase-admin');

async function run() {
  // Inicializa o SDK: requer credenciais de service account.
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(), // espera GOOGLE_APPLICATION_CREDENTIALS ou env configurada
    });
  }

  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Senha123!';

  try {
    // Tenta encontrar o usuário
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('Usuário já existe:', userRecord.uid);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: 'Admin',
          emailVerified: true,
        });
        console.log('Usuário criado:', userRecord.uid);
      } else {
        throw e;
      }
    }

    // Define claim admin
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log('Custom claim {admin:true} aplicado ao UID:', userRecord.uid);
    console.log('Credenciais de teste — email:', email, 'senha:', password);
    process.exit(0);
  } catch (err) {
    console.error('Erro ao criar admin:', err);
    process.exit(1);
  }
}

run();
