// 🔧 PATCH WIDGET - Grist_App_Nest_v5_2.html
// Ligne ~1393-1450 : Fonction sendAIToAlbert()

// ❌ CODE ACTUEL (INCOMPLET)
/*
async sendAIToAlbert(context) {
    try {
        const chatUrl = this.webhookUrl.includes('?')
            ? `${this.webhookUrl}&action=albert_chat`
            : `${this.webhookUrl}?action=albert_chat`;

        const webhookData = {
            messageId: `ai_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            message: context.message,
            mode: context.mode,
            // ❌ documentId MANQUANT
        };

        // ... rest of function
    }
}
*/

// ✅ CODE CORRIGÉ (COMPLET)
async sendAIToAlbert(context) {
    try {
        const chatUrl = this.webhookUrl.includes('?')
            ? `${this.webhookUrl}&action=albert_chat`
            : `${this.webhookUrl}?action=albert_chat`;

        const webhookData = {
            messageId: `ai_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            message: context.message,
            mode: context.mode,
            documentId: this.documentId,  // ✅ AJOUTÉ - Document Grist actuel
            gristBaseUrl: window.location.origin || 'https://grist.numerique.gouv.fr',  // ✅ AJOUTÉ
            conversationHistory: this.conversationHistory.slice(-5),
            timestamp: new Date().toISOString(),
            version: 'v5.2-with-docid'
        };

        console.log('📤 Envoi au webhook n8n avec docId:', {
            url: chatUrl,
            documentId: this.documentId,
            message: context.message.substring(0, 50) + '...'
        });

        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData)
        });

        if (!response.ok) {
            throw new Error(`Erreur n8n: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Réponse n8n reçue:', data);

        return data;

    } catch (error) {
        console.error('❌ Erreur sendAIToAlbert:', error);
        throw error;
    }
}

// 📝 INSTRUCTIONS D'APPLICATION
/*
1. Ouvrir Grist_App_Nest_v5_2.html dans un éditeur
2. Chercher la fonction sendAIToAlbert (ligne ~1393)
3. Remplacer TOUT le contenu de la fonction par le code ci-dessus
4. Sauvegarder
5. Re-déployer le widget (commit + push)
6. Recharger le widget dans Grist

VÉRIFICATION:
- Ouvrir la console navigateur (F12)
- Envoyer un message au chat IA
- Vérifier le log: "📤 Envoi au webhook n8n avec docId: {...}"
- Le documentId doit afficher l'ID du document actuel
*/
