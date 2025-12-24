# httpchain-utils

A React component that captures and displays HTTP network traffic from browser tabs using a Chrome extension.


### Peer Dependencies

Consumers must install these peer dependencies:

```bash
npm install react react-dom tailwindcss radix-ui lucide-react react-window react-virtualized-auto-sizer react-syntax-highlighter class-variance-authority clsx tailwind-merge zustand
```

### Tailwind CSS Setup

Add this to your CSS file to scan the package for Tailwind classes:

```css
@import "tailwindcss";

@source "../node_modules/httpchain-utils";
```

## Usage

```tsx
import { HttpChainWebRecorder, useBookmarkedRequests } from "httpchain-utils";

function App() {
    // Optional: subscribe to bookmarked requests
    const bookmarkedRequests = useBookmarkedRequests();

    return (
        // Container must have a defined height
        <div className="h-screen w-screen">
            <HttpChainWebRecorder
                // Required: Chrome extension ID
                extensionId="your-extension-id"

                // Optional: Show warning when this many requests are captured (default: 1000)
                maxRequestsWarningThreshold={1000}

                // Optional: Show warning when this many tabs are being captured (default: 10)
                maxTabsWarningThreshold={10}

                // Optional: If true, user MUST clear requests to continue when limit reached (default: false)
                strictRequestsLimit={false}

                // Optional: Additional CSS classes for the container
                className="my-custom-class"
            />
        </div>
    );
}
```

## Chrome Extension

The package requires the HTTPChain Chrome extension to capture network traffic. Install the extension from the `chrome-extension` folder included in the package.
