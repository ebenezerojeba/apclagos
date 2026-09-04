import Link from "next/link";

/**
 * Shown at /keystatic when the editor has not been connected to GitHub yet.
 *
 * This segment renders outside the site's chrome and styles, so everything here
 * is inline — it has to be legible on a deployment where nothing else about the
 * CMS is working.
 */
export function SetupRequired({ missing }: { missing: string[] }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: "3rem 1.5rem",
        background: "#fbfaf7",
        color: "#0d1b31",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <div style={{ maxWidth: "44rem", margin: "0 auto" }}>
        <p
          style={{
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#971b26",
            margin: 0,
          }}
        >
          APC Lagos — content admin
        </p>
        <h1 style={{ fontSize: "1.875rem", margin: "0.75rem 0 0", fontWeight: 600 }}>
          The editor is not connected yet
        </h1>
        <p style={{ marginTop: "0.75rem", color: "#4f5c72" }}>
          The public site is unaffected and running normally. Editing needs a
          GitHub App so that saved changes can be committed to the repository —
          that is also what signs editors in, so no separate password exists.
        </p>

        <h2 style={{ fontSize: "1.125rem", marginTop: "2.5rem" }}>
          To connect it
        </h2>
        <ol style={{ color: "#4f5c72", paddingLeft: "1.25rem" }}>
          <li style={{ marginTop: "0.75rem" }}>
            Run the site locally with <code style={code}>npm run dev</code> and
            open <code style={code}>/keystatic</code>. In development the editor
            runs against your working tree and needs no credentials, so you can
            start adding records immediately.
          </li>
          <li style={{ marginTop: "0.75rem" }}>
            Use Keystatic&rsquo;s own setup screen there to create the GitHub
            App. It writes the five values below into your local{" "}
            <code style={code}>.env.local</code>.
          </li>
          <li style={{ marginTop: "0.75rem" }}>
            Copy those five values into the deployment&rsquo;s environment
            variables, then redeploy.
          </li>
        </ol>

        <h2 style={{ fontSize: "1.125rem", marginTop: "2.5rem" }}>
          Still missing here
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding: "1rem 1.25rem",
            margin: "0.75rem 0 0",
            border: "1px solid #e0d9cc",
            borderRadius: "0.75rem",
            background: "#fff",
          }}
        >
          {missing.map((name) => (
            <li key={name} style={{ padding: "0.25rem 0" }}>
              <code style={code}>{name}</code>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#77808f" }}>
          Once connected, anyone you add as a collaborator on the repository can
          edit. Removing their GitHub access removes their editing access — there
          is no separate user list to keep in step.
        </p>

        <p style={{ marginTop: "2rem" }}>
          <Link href="/" style={{ color: "#1c3557", fontWeight: 600 }}>
            ← Back to the site
          </Link>
        </p>
      </div>
    </main>
  );
}

const code: React.CSSProperties = {
  background: "#f3efe8",
  padding: "0.1rem 0.4rem",
  borderRadius: "0.25rem",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "0.8125rem",
  color: "#142642",
};
