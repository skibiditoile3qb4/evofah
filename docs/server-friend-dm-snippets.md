# Server updates required for Friend Requests + DMs

Yes — you **do need server changes**.

Your client now sends these WebSocket message types:
- `friend_request`
- `friend_request_response`
- `dm_message`

Without server handlers, your current server falls into `default` and returns `Unknown message type`.

---

## 1) Add in `handleMessage(...)` switch

### Before
```js
case 'airstrike':
  handleAirstrike(clientId, data);
  break;

default:
  client.ws.send(JSON.stringify({
    type: 'error',
    message: 'Unknown message type'
  }));
```

### After
```js
case 'airstrike':
  handleAirstrike(clientId, data);
  break;

case 'friend_request':
  handleFriendRequest(clientId, data);
  break;

case 'friend_request_response':
  handleFriendRequestResponse(clientId, data);
  break;

case 'dm_message':
  handleDMMessage(clientId, data);
  break;

default:
  client.ws.send(JSON.stringify({
    type: 'error',
    message: 'Unknown message type'
  }));
```

---

## 2) Add helper: find online user by username

```js
function findOnlineClientByUsername(username) {
  if (!username) return null;
  for (const [, c] of clients.entries()) {
    if (c.username === username && c.ws.readyState === WebSocket.OPEN) {
      return c;
    }
  }
  return null;
}
```

---

## 3) Add friend request handler (online-only)

```js
function handleFriendRequest(clientId, data) {
  const sender = clients.get(clientId);
  if (!sender) return;

  const toUsername = (data.toUsername || '').trim();
  if (!toUsername) {
    sender.ws.send(JSON.stringify({
      type: 'friend_request_result',
      success: false,
      message: 'Username is required'
    }));
    return;
  }

  if (toUsername === sender.username) {
    sender.ws.send(JSON.stringify({
      type: 'friend_request_result',
      success: false,
      message: 'You cannot send a friend request to yourself'
    }));
    return;
  }

  const target = findOnlineClientByUsername(toUsername);
  if (!target) {
    sender.ws.send(JSON.stringify({
      type: 'friend_request_result',
      success: false,
      message: 'Player must be online to receive friend requests'
    }));
    return;
  }

  target.ws.send(JSON.stringify({
    type: 'friend_request',
    fromUsername: sender.username
  }));

  sender.ws.send(JSON.stringify({
    type: 'friend_request_result',
    success: true,
    message: `Friend request sent to ${toUsername}`
  }));
}
```

---

## 4) Add friend request response handler

```js
function handleFriendRequestResponse(clientId, data) {
  const responder = clients.get(clientId);
  if (!responder) return;

  const fromUsername = (data.fromUsername || '').trim();
  const accepted = !!data.accepted;

  if (!fromUsername) return;

  const originalSender = findOnlineClientByUsername(fromUsername);
  if (!originalSender) return; // sender went offline; nothing to deliver

  originalSender.ws.send(JSON.stringify({
    type: 'friend_request_response',
    username: responder.username,
    accepted
  }));

  // Optional: tell responder too for UI confirmation
  responder.ws.send(JSON.stringify({
    type: 'friend_request_response',
    username: fromUsername,
    accepted
  }));
}
```

---

## 5) Add DM relay handler (online-only)

```js
function handleDMMessage(clientId, data) {
  const sender = clients.get(clientId);
  if (!sender) return;

  const toUsername = (data.toUsername || '').trim();
  const message = (data.message || '').trim();

  if (!toUsername || !message) return;

  const target = findOnlineClientByUsername(toUsername);
  if (!target) {
    sender.ws.send(JSON.stringify({
      type: 'error',
      message: 'Both players must be online to DM'
    }));
    return;
  }

  target.ws.send(JSON.stringify({
    type: 'dm_message',
    fromUsername: sender.username,
    message: message.substring(0, 500),
    timestamp: Date.now()
  }));
}
```

---

## 6) (Optional but recommended) prevent duplicate usernames online

If two online users share one username, friend requests/DMs can route to the wrong person.
Add this check in `handleJoin(...)` before setting room membership:

```js
for (const [id, c] of clients.entries()) {
  if (id !== clientId && c.username === username && c.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({
      type: 'error',
      message: 'That username is already online. Please choose another.'
    }));
    return;
  }
}
```

---

## Notes
- Friends + DM history are intentionally localStorage-only on each client.
- If a player is offline, request/DM should fail exactly as requested.
- No MongoDB schema updates are required for this feature unless you want server persistence later.
