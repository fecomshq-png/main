# Advisory Practice Intake

A confidential questionnaire you send to a client as a link. They fill it in
over as many sittings as they like; every answer lands in a Google Sheet you
own, and you read the responses either in the Sheet or through a passcode-
protected screen inside the form itself.

- **85 questions across 9 sections**, 44 of them required.
- **Autosaves.** The address bar becomes the client's personal resume link.
- **Partial answers are visible to you** — you can see a form in progress, not
  just a completed one.
- **No server to run and nothing to pay for.** A static page plus a Google
  Apps Script bound to your Sheet.

---

## Setup

Roughly fifteen minutes, once.

### 1. Create the Sheet

Go to [sheets.new](https://sheets.new) and name it something like
`ETS Intake Responses`. Leave it empty — the script creates the tabs it needs.

### 2. Add the script

In that Sheet: **Extensions → Apps Script**. Delete the placeholder
`function myFunction() {}` and paste the entire contents of
[`apps-script/Code.gs`](apps-script/Code.gs).

At the top of the file, change two settings:

```js
var ADMIN_KEY = 'change-this-key';   // your passcode — make it long and random
var NOTIFY_EMAIL = '';               // your email, to be told about submissions
```

`ADMIN_KEY` never reaches the client's browser. It exists only in this file,
and you type it in when you want to read responses. Treat it like a password.

Save (Ctrl/Cmd-S), then pick `setup` from the function dropdown and press
**Run**. Google asks you to authorise the script — go through
*Advanced → Go to (project name)* and allow it. This creates the tabs and gets
the permission prompt out of the way, so the first real submission isn't the
thing that trips over it.

### 3. Deploy it as a web app

**Deploy → New deployment → gear icon → Web app.**

| Field | Value |
| --- | --- |
| Description | anything |
| Execute as | **Me** |
| Who has access | **Anyone** |

"Anyone" is required — your client is not signed into your Google account.
It does not make the Sheet public; it only means this script will accept
requests. Reading responses still needs the passcode.

Copy the **Web app URL**. It ends in `/exec`.

### 4. Point the form at it

Open [`assets/config.js`](assets/config.js) and paste the URL in:

```js
window.API_URL = "https://script.google.com/macros/s/AKfy…/exec";
```

That is the only file you ever need to edit to get running.

### 5. Publish the page

Any static host works — it is one HTML file and three assets. The simplest is
GitHub Pages, which this repository is already set up for: push to the default
branch and the workflow in `.github/workflows/pages.yml` switches Pages on and
publishes to `https://<your-username>.github.io/<repo>/`. The Actions run
prints the exact URL. Send that link to the client.

If the deploy step reports *Get Pages site failed*, enable it by hand once
under **Settings → Pages → Source: GitHub Actions** and re-run the workflow.

Dropbox, Netlify drop, Google Sites or your own web host are all fine too —
open `index.html` and everything works, because there is no build step.

### 6. Check it end to end

Open the published link, answer one question, wait for the note to read
*Draft saved*, and confirm a row appeared in the Sheet's **Responses** tab.
Then click **Practice access** at the bottom of the page and enter your
`ADMIN_KEY`. If both work, send the link.

---

## Reading responses

**In the Sheet.** The `Responses` tab has one row per person and one column
per question, with the answer in plain readable text. Sort, filter and comment
as you would on any sheet.

**In the form.** Click *Practice access* in the footer, enter the passcode, and
you get every response — including drafts still being filled in — with
*Copy as text* and *Download CSV* on each. The text copy is formatted for
pasting into a document or a chat.

There is also a hidden `_Data` tab. It holds the exact structure of each
answer, which is what makes resuming a draft work. Leave it alone.

---

## Changing the questions

Everything lives in [`assets/questions.js`](assets/questions.js). One entry per
question:

```js
{ id:"1.1", t:"How many clients?", type:"num", req:true, unit:"Rs", help:"..." }
```

| Field | Meaning |
| --- | --- |
| `id` | Short label, shown to the client and used as the column key. Must be unique. |
| `t` | The question itself. |
| `type` | `text`, `num`, `long`, `radio`, `check` or `grid`. |
| `req` | `true` makes it required before the form can be submitted. |
| `opts` | The options, for `radio` and `check`. |
| `rows` / `cols` | For `grid`. `grid:"pct"` gives percentage rows with a live total; anything else gives a radio matrix and needs `cols`. |
| `unit` | Prefix shown beside the input, e.g. `Rs`, `%`, `hrs`. |
| `help` | Grey explanatory line under the question. |
| `big` | `true` gives a taller box, for long written answers. |

Adding or renaming a question appends a new column to the Sheet. It never
rewrites or reorders the columns already there, so answers collected before
the change stay intact and stay aligned.

---

## Notes on privacy

This questionnaire asks for credit scores, regulatory history and financial
statements. Worth knowing:

- The page is marked `noindex`, but that is only a request to search engines.
  **Anyone with the link can open the form.** Send it directly, once.
- A person's resume link (`#s=…`) reopens their draft. Whoever holds that link
  can read what has been filled in so far. Treat it as private.
- Responses live in your Google account. Their security is your Google
  account's security — use two-factor authentication.
- `ADMIN_KEY` is sent as a URL parameter when you open the responses screen, so
  it appears in your own Apps Script execution logs. It is not exposed to the
  client, but do not reuse a password from anywhere else.
- To revoke access entirely: **Deploy → Manage deployments → Archive**. The
  form stops saving immediately; the data in the Sheet is untouched.

---

## Layout

```
index.html                 the page
assets/config.js           ← the one file you edit
assets/questions.js        the 85 questions
assets/app.js              rendering, validation, autosave, admin screen
assets/styles.css          styling
apps-script/Code.gs        the backend that lives in your Sheet
.github/workflows/pages.yml  publishes the page on push
```

## If something breaks

**"Not connected to the response sheet"** — `API_URL` in `assets/config.js` is
still the placeholder, the deployment is set to anything other than *Anyone*,
or the deployment was archived. After editing `Code.gs` you must
**Deploy → Manage deployments → edit → Version: New version**; saving the file
alone does not update the live web app.

**Nothing arrives in the Sheet** — in the Apps Script editor, open *Executions*
in the left sidebar. Failed runs and their errors are listed there. Running
`selfTest` from the editor writes a dummy row end to end; delete it from both
tabs afterwards.

**"Wrong passcode"** — `ADMIN_KEY` in the deployed *version* differs from what
you typed. Redeploy as a new version after changing it.

**A client says their answers vanished** — they opened the bare link rather
than their `#s=…` resume link, which starts a fresh session. Their earlier
draft is still in the Sheet; send them back their original link.
