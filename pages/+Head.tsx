// https://vike.dev/Head

//# BATI.has("mantine")
import logoUrl from "../assets/logo.svg";

export default function HeadDefault() {
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href={logoUrl} />
    </>
  );
}
