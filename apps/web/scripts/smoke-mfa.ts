/**
 * End-to-end MFA against the real API:
 * login (no MFA) → enroll → confirm → logout → login (challenge) → verify → disable.
 */
import { TOTP } from 'otpauth'
import { login, verifyMfa, enrollMfa, confirmMfa, disableMfa, logout } from '../src/api/auth'
import { bindAuthToken } from '../src/api/http'
import { isMfaChallenge } from '../src/types/models'

function totpCode(secret: string): string {
  return new TOTP({ secret, algorithm: 'SHA1', digits: 6, period: 30 }).generate()
}

async function main() {
  let session = await login({
    email: 'admin@example.com',
    password: 'password',
  })
  if (isMfaChallenge(session)) {
    throw new Error('admin unexpectedly requires MFA at start — disable MFA on API first')
  }
  console.log('1) login without MFA ok, mfa_enabled=', session.user.mfa_enabled)
  bindAuthToken(() => session.token)

  if (session.user.mfa_enabled) {
    await disableMfa()
    console.log('   disabled leftover MFA')
  }

  const enroll = await enrollMfa()
  console.log('2) enrolled secret length=', enroll.secret.length)
  const confirmCode = totpCode(enroll.secret)
  await confirmMfa(confirmCode)
  console.log('3) confirmed MFA with code', confirmCode)

  await logout()
  bindAuthToken(() => null)
  console.log('4) logged out')

  const challenge = await login({
    email: 'admin@example.com',
    password: 'password',
  })
  if (!isMfaChallenge(challenge)) {
    throw new Error('expected mfa_required after enroll')
  }
  console.log('5) login returned MFA challenge')

  const verifyCode = totpCode(enroll.secret)
  session = await verifyMfa(challenge.mfa_token, verifyCode)
  bindAuthToken(() => session.token)
  console.log('6) MFA verify ok, mfa_enabled=', session.user.mfa_enabled)
  if (!session.user.mfa_enabled) {
    throw new Error('expected mfa_enabled true after verify')
  }

  await disableMfa()
  console.log('7) MFA disabled')

  await logout()
  bindAuthToken(() => null)
  const again = await login({
    email: 'admin@example.com',
    password: 'password',
  })
  if (isMfaChallenge(again)) {
    throw new Error('expected direct login after disable')
  }
  console.log('8) login without MFA again ok')
  console.log('MFA FLOW OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
