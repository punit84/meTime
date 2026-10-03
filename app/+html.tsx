import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Web root HTML layout with CSS reset ensuring 0 margins, 0 gaps, and viewport fill
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webResetStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const webResetStyles = `
html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  min-height: 100%;
  background-color: #F6F1EA;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;
