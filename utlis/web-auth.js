const { verifyAuthenticationResponse } = require('@simplewebauthn/server');

/**
 * Verifies the WebAuthn response.
 * 
 * @param {Object} user - The user document from the database.
 * @param {Object} credential - The WebAuthn assertion (response from the client).
 * @param {string} challenge - The original challenge sent to the client.
 * @returns {boolean} - Whether the WebAuthn response is valid.
 */
async function verifyWebAuthnResponse(user, credential, challenge, body) {
    try {
        // Step 1: Prepare the data for verification
        const expectedChallenge = challenge; // The challenge you sent to the frontend before
        const expectedOrigin = 'https://localhost'; // Frontend origin
        const expectedRPID = 'localhost'; // The RPID (usually the domain name)

        console.log(credential);

        // Step 2: Verify the WebAuthn assertion (the response sent by the client)
        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge,
            expectedOrigin,
            expectedRPID,
            authenticators: [
                {
                    credentialID: user.webAuthnClientId, // The ID of the stored WebAuthn credential
                    credentialPublicKey: user.webAuthnPublicKey, // The stored public key for verification
                }
            ]
        });
        console.log(verification);


        if (verification.success) {
            // Update the counter and other necessary fields for the user after successful authentication
            user.webAuthnCounter = verification.newCounter;
            await user.save();

            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error verifying WebAuthn response:', error);
        return false;
    }
}

module.exports = { verifyWebAuthnResponse };
