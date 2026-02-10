# Voice notes server patch (no DB storage)

Use this to update your relay server so voice notes work with the client changes.

## 1) Add `voice_note` to `handleMessage`

Inside your `switch (data.type)` add:

```js
case 'voice_note':
  handleVoiceNote(clientId, data);
  break;
```

---

## 2) Add a voice-note handler

Place this near `handleChat`:

```js
function isValidBase64(str) {
  if (typeof str !== 'string' || str.length === 0) return false;
  // base64 chars only (allow trailing =)
  return /^[A-Za-z0-9+/]+={0,2}$/.test(str);
}

function getBase64SizeBytes(base64) {
  const padding = (base64.match(/=+$/) || [''])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function handleVoiceNote(clientId, data) {
  const client = clients.get(clientId);
  if (!client || !client.room) return;

  const {
    room,
    voiceNote,
    voiceMimeType,
    message,
    nametag
  } = data;

  // Must send only to own active room
  if (room !== client.room) return;

  // Staff chat access check (same as text chat)
  if (room === 'staff_chat') {
    const staffRanks = ['owner', 'sr.admin', 'admin', 'moderator'];
    if (!staffRanks.includes(client.status)) {
      client.ws.send(JSON.stringify({
        type: 'error',
        message: 'Staff chat is for staff only'
      }));
      return;
    }
  }

  if (!isValidBase64(voiceNote)) {
    client.ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid voice note payload'
    }));
    return;
  }

  // Keep this in sync with client max (2MB)
  const MAX_BYTES = 2 * 1024 * 1024;
  const payloadBytes = getBase64SizeBytes(voiceNote);
  if (payloadBytes <= 0 || payloadBytes > MAX_BYTES) {
    client.ws.send(JSON.stringify({
      type: 'error',
      message: 'Voice note too large'
    }));
    return;
  }

  // Optional basic mime allowlist
  const allowedMimes = new Set([
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/mpeg'
  ]);

  const safeMime = allowedMimes.has(voiceMimeType) ? voiceMimeType : 'audio/webm';

  const voiceMessage = {
    id: generateId(),
    username: client.username,
    status: client.status || 'player',
    nametag: nametag || 'none',
    clientId,
    message: (message || '🎤 Voice note').substring(0, 120),
    voiceNote,
    voiceMimeType: safeMime,
    timestamp: Date.now()
  };

  // IMPORTANT: do NOT call saveMessage() for voice notes
  log('VOICE_NOTE', {
    room: client.room,
    username: client.username,
    bytes: payloadBytes,
    mime: safeMime,
    ip: client.ip
  });

  broadcast(client.room, {
    type: 'voice_note',
    message: voiceMessage
  });
}
```

---

## 3) Keep DB history text-only

No change needed in `saveMessage` / `loadChatHistory` unless you currently route `voice_note` through `handleChat`.

As long as you keep voice notes in `handleVoiceNote` and do **not** call `saveMessage`, they will not be stored in MongoDB.

---

## 4) Optional hardening (recommended)

- Add per-user cooldown (e.g. 1 voice note / 2 seconds).
- Reject very short payloads (< 400 bytes) if spam appears.
- Consider skipping `voiceNote` body in logs (already done above).
