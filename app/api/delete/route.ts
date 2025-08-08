// app/api/deleteUser/route.ts
import { NextResponse } from 'next/server'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Firebase Admin SDK initialization
const serviceAccount = {
  projectId: 'scanner-afaf8',
  clientEmail: 'firebase-adminsdk-fbsvc@scanner-afaf8.iam.gserviceaccount.com',
  privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBA DANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6yx5LknEHMCiS\n/4iLmp+7cljjIw5hhxZvIFZ2+oaL8+hUUYtzcdctUxj5paxrz33Gsqc0RORTt7W8\nTMM3Nd5NmPGMLDnmR2ATXAAOXAGt6t4JnMNO7tGJIaph4XTG8Ymrv9q5GeV4M1wX\nGXVHfRSdkqQPAGpKv1XVEzpUViQdYTDXmIGaN225emPUW6d95G26AmrMy5O/Btfg\nRHFvBsIi60aKqHW8g2MnWLkD1sxauycov6b5mDbv3t0+26z1wy7RRMjXWXbtENGA\nia9tewlGrC7CXGWtHz9FkTje48UVvtYvnkkL4ou41K9WS4MjHabA4rubBsNbmEfP\n8Ve10/Y3AgMBAAECggEACpanAfusIo8tTZ/kmp1KPrLtrPp4vziMIgKAREBRTi+m\nVNlGgWXLn8sdGFG242mgpJnN9p2NH93DFIh5bHDGSDnKP3rmUVJsdMx7SFUY10YA\nDiVvwNKy2AYrhV7lYr2gYzb97A42vsiSiNCtoD7L417DpAIPBGuyLuDnJo63f17B\nPPRhGoXBP7h50m5xvkp8zxJp0sKqgB5uNEDXImxYVDankKPH6O2osfZk/zzvksnF\nOBh9u23k0AjQugmMb+WK7SZ9ZZFcYpX1WzC1CzzX7LbXdY2Fj/XeMfaZgP2vFj69\nE+ryhbdPWCOmFh1F9vU1VcP/B2BN4vqMw2ZpkXCfcQKBgQDfO681h++j2ZmNlMP1\nB04hDMZL/fhNi4gC4F+2baOnZrF7f3t8wjvF30DUC8tS8jURCKklAEU0A54X0B40\n2a8I2Dc9/8HODYv4sA+kKZQhepTWjkQPVKYG7fWDUF984vDk2ZbyHqJDKn7rEfoL\nN3X1/QgYn0b2LF51IMPAlxJE2QKBgQDWNihqH3OzK6EO1GtgRaUtWmPR0tt03jCY\n3PQAcseXj7YNhXd+wGzaBGru/HWtYqSLSAG1dH3s8hErxhlLFLTtWaLDacRRBEsJ\nHCKmdDcsmYcJEV2nEx7eW4zchNs9qP8w5QPLefn9wgSTSc5lgXP86YZfxUmaYOE5\nBNImL+bpjwKBgADZIDRK3O05cWzpSMlQispzWvmE8IGS6yRfp91wkzOan0gB1v1F\nW6bHz14+4Tnic7Mp3kKmupyU+u/KOaMnxJN7BtK0ew8GXCbIvHZ6NfbemVwrVDTe\ntHbIRquGDabS0el8ricjWKh6q9rGybVrM4aIvJQjXsimqIE3a6b6q/YZAoGBAIAi\nUTZ5rdnFBUg7pCcoQc/JO+BtArz7k5I8yO/juKReYIXiCkKVlActkVF3TmTyln6C\nChOipRixC7hlfQe+USOQ9J1zjOzxZnkCjW+IIODazT2NV7ny5AoaNT5LcmGFz3BN\n7WEvi2xRPC9mfMGXF+x3O9vZxVdFEDPtQE97Y+LdAoGAQwhLFN3rkPxtDNhZ8EmK\nj01BC33m1xTs2OL3+nKU/rxt5dEe3o3ULnOwamseNPVW98YyN0w/V+RVPUO+zfBJ\nh7PhdvzruN7MwYYHrham+tSck9txkObUkCber+42XNCHIhy6EiouznM5mgZLD2uC\nuBKf4MXszl5a99Cas+w5O/k=\n-----END PRIVATE KEY-----\n`,
}

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) })
}

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  try {
    const auth = getAuth()
    const userRecord = await auth.getUserByEmail(email)
    await auth.deleteUser(userRecord.uid)
    return NextResponse.json({ success: true })
  }catch (error: unknown) {
  console.error('Deletion error:', error);

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'auth/user-not-found'
  ) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const errorMessage = 
    typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : 'Unknown error';

  return NextResponse.json(
    { error: 'Failed to delete user', details: errorMessage },
    { status: 500 }
  );
}

}