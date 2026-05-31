declare module "swagger-ui-react" {
  import type { ComponentType } from "react";

  interface SwaggerUIProps {
    url?: string;
    spec?: Record<string, unknown>;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    filter?: boolean | string;
    showMutatedRequest?: boolean;
    supportedSubmitMethods?: string[];
    requestInterceptor?: (req: unknown) => unknown;
    responseInterceptor?: (res: unknown) => unknown;
    onComplete?: () => void;
    presets?: unknown[];
    plugins?: unknown[];
    layout?: string;
    deepLinking?: boolean;
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    tryItOutEnabled?: boolean;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
