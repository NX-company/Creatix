import bcrypt from 'bcryptjs'

const storedHash = '$2b$10$iNaJa8pfMXgXmIyz2VPMqOD078qI28ip4hyybDthUlwfBR8Ow0bkO'
const password = 'admin123'

async function test() {
  console.log('Testing password verification...')
  console.log('Password:', password)
  console.log('Hash:', storedHash)
  
  const isValid = await bcrypt.compare(password, storedHash)
  console.log('\nResult:', isValid ? '✅ Password VALID' : '❌ Password INVALID')
  
  // Also test with your registered user
  const userHash = '$2b$10$ICbSSHLd1cJssoJsefBSV.hnBQt/sT0uohG2/pCeNS0VOZ8okHXdK'
  console.log('\n\nTesting if your registered password works...')
  console.log('Try logging in with:')
  console.log('Email: useneurox@gmail.com')
  console.log('Password: (whatever you used during registration)')
}

test()

