// engine.js adaptado para la API de Anthropic

let currentLevel = localStorage.getItem("lumora_nivel") || "equilibrado";

export function getNivel() {
    return currentLevel;
}

export function setNivel(nivel) {
    currentLevel = nivel;
    localStorage.setItem("lumora_nivel", nivel);
}

export async function pick(onProgress) {
    onProgress("Conectado a Anthropic API");
    // Modelo recomendado de Claude (ej: claude-3-5-sonnet-20241022)
    return "claude-3-5-sonnet-20241022"; 
}

export async function stream(model, messages, onChunk, signal, onStatus) {
    onStatus("Pensando...");

    const API_URL = "https://api.anthropic.com/v1/messages";
    const API_KEY = "TU_API_KEY_DE_ANTHROPIC"; // Reemplaza con tu clave de Anthropic

    // Anthropic separa el system prompt del array de mensajes por requerimientos de su API
    let systemPrompt = "";
    const formattedMessages = [];

    for (const m of messages) {
        if (m.role === "system") {
            systemPrompt = m.content;
        } else {
            formattedMessages.push({
                role: m.role,
                content: m.content
            });
        }
    }

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true" // Necesario si se llama directamente desde el navegador
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: formattedMessages,
            stream: true
        }),
        signal: signal
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error en la API de Anthropic (${response.status}): ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const dataStr = trimmed.replace("data:", "").trim();

            try {
                const json = JSON.parse(dataStr);
                // El streaming de Anthropic emite diferentes eventos (content_block_delta, etc.)
                if (json.type === "content_block_delta" && json.delta?.text) {
                    onChunk(json.delta.text);
                }
            } catch (e) {
                // Ignorar errores de parsing en fragmentos
            }
        }
    }
}
