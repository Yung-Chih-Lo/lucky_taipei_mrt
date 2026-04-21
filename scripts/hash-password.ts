/* Usage: npm run hash-password -- '<your-password>'
   Prints an argon2id hash suitable for ADMIN_PASSWORD_HASH. */
import { hash } from '@node-rs/argon2'

async function main() {
  const pw = process.argv[2]
  if (!pw) {
    console.error('Usage: npm run hash-password -- <password>')
    process.exit(1)
  }
  const h = await hash(pw)
  console.log(h)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
