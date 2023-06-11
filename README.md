# Signway JS sdk

Generate signed urls for [Signway](https://github.com/gabotechs/signway), so that they can be
used in client-side code.

# Install

```shell
npm install signway-sdk
```

```ts
import { signUrl } from "signway-sdk";

console.log(signUrl({
  id: "my-id",
  secret: "my-secret",
  host: "https://api.signway.io",
  proxyUrl: "https://api.openai.com/v1/chat/completions",
  expiry: 10,
  method: "POST"
}))
```
