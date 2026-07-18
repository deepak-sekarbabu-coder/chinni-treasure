import { openApiSpec } from "@/src/lib/openapi-spec";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation — Chinni Treasure",
  description:
    "Interactive API documentation for the Chinni Treasure platform. Browse endpoints, schemas, and authentication details.",
  alternates: {
    canonical: "/docs",
  },
};

type Schema = {
  type?: string;
  format?: string;
  description?: string;
  enum?: readonly string[];
  nullable?: boolean;
  default?: unknown;
  required?: readonly string[];
  properties?: Readonly<Record<string, Schema>>;
  items?: Schema;
  $ref?: string;
};

type Operation = {
  tags?: readonly string[];
  summary?: string;
  description?: string;
  operationId?: string;
  security?: readonly unknown[];
  parameters?: ReadonlyArray<{
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: Schema;
  }>;
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: Schema; example?: unknown }>;
  };
  responses?: Record<
    string,
    {
      description?: string;
      content?: Record<string, { schema?: Schema }>;
      headers?: Record<string, { description?: string; schema?: Schema }>;
    }
  >;
};

const httpMethods = ["get", "post", "put", "patch", "delete"] as const;
const methodLabels: Record<(typeof httpMethods)[number], string> = {
  get: "GET",
  post: "POST",
  put: "PUT",
  patch: "PATCH",
  delete: "DELETE",
};

function schemaLabel(schema?: Schema): string {
  if (!schema) return "any";
  if (schema.$ref) return schema.$ref.split("/").pop() ?? schema.$ref;
  if (schema.type === "array") return `${schemaLabel(schema.items)}[]`;
  return [schema.type, schema.format].filter(Boolean).join(":") || "object";
}

function renderSchema(schema?: Schema, required: readonly string[] = []) {
  if (!schema) return null;

  if (schema.$ref || !schema.properties) {
    return (
      <span className="docs-schema-inline">
        {schemaLabel(schema)}
        {schema.nullable ? " | null" : ""}
      </span>
    );
  }

  return (
    <div className="docs-schema">
      {Object.entries(schema.properties).map(([name, property]) => (
        <div className="docs-schema-row" key={name}>
          <div>
            <span className="docs-schema-name">{name}</span>
            {required.includes(name) ? <span className="docs-required">Required</span> : null}
          </div>
          <div className="docs-schema-meta">
            {schemaLabel(property)}
            {property.nullable ? " | null" : ""}
            {property.enum ? ` - ${property.enum.join(", ")}` : ""}
          </div>
          {property.description ? <p>{property.description}</p> : null}
        </div>
      ))}
    </div>
  );
}

function EndpointCard({ path, method, operation }: { path: string; method: string; operation: Operation }) {
  const requestContent = Object.entries(operation.requestBody?.content ?? {});
  const parameters = operation.parameters ?? [];
  const responses = Object.entries(operation.responses ?? {});

  return (
    <article className={`docs-operation docs-operation-${method}`}>
      <header className="docs-operation-header">
        <span className="docs-method">{methodLabels[method as keyof typeof methodLabels]}</span>
        <code>{path}</code>
      </header>

      <div className="docs-operation-body">
        <div>
          <p className="docs-operation-tag">{operation.tags?.join(", ")}</p>
          <h2>{operation.summary}</h2>
          {operation.description ? <p>{operation.description}</p> : null}
          {operation.operationId ? <code className="docs-operation-id">{operation.operationId}</code> : null}
          {operation.security?.length ? <span className="docs-auth">Admin session required</span> : null}
        </div>

        <ParametersSection parameters={parameters} />
        <RequestBodySection requestContent={requestContent} required={operation.requestBody?.required} />
        <ResponsesSection responses={responses} />
      </div>
    </article>
  );
}

function ParametersSection({ parameters }: { parameters: NonNullable<Operation["parameters"]> }) {
  if (!parameters.length) return null;
  return (
    <section className="docs-detail">
      <h3>Parameters</h3>
      <div className="docs-table">
        {parameters.map((parameter) => (
          <div className="docs-table-row" key={`${parameter.in}-${parameter.name}`}>
            <strong>{parameter.name}</strong>
            <span>{parameter.in}</span>
            <span>{schemaLabel(parameter.schema)}</span>
            <span>{parameter.required ? "Required" : "Optional"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RequestBodySection({ requestContent, required }: { requestContent: [string, { schema?: Schema; example?: unknown }][]; required?: boolean }) {
  if (!requestContent.length) return null;
  return (
    <section className="docs-detail">
      <h3>Request Body{required ? " *" : ""}</h3>
      {requestContent.map(([contentType, content]) => (
        <div className="docs-payload" key={contentType}>
          <code>{contentType}</code>
          {renderSchema(content.schema, content.schema?.required)}
          {content.example ? (
            <pre>{JSON.stringify(content.example, null, 2)}</pre>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function ResponsesSection({ responses }: { responses: [string, { description?: string }][] }) {
  if (!responses.length) return null;
  return (
    <section className="docs-detail">
      <h3>Responses</h3>
      <div className="docs-responses">
        {responses.map(([status, response]) => (
          <div className="docs-response" key={status}>
            <span>{status}</span>
            <p>{response.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ApiDocsPage() {
  const operations = Object.entries(openApiSpec.paths).flatMap(([path, pathConfig]) =>
    httpMethods.flatMap((method) => {
      const operation = (pathConfig as unknown as Readonly<Record<string, Operation>>)[method];
      return operation ? [{ path, method, operation }] : [];
    }),
  );

  return (
    <main className="docs-page">
      <div className="docs-header">
        <p className="docs-kicker">Version {openApiSpec.info.version}</p>
        <h1 className="docs-title">{openApiSpec.info.title}</h1>
        <p className="docs-subtitle">{openApiSpec.info.description}</p>
      </div>

      <div className="docs-content">
        <section className="docs-tags" aria-label="API areas">
          {openApiSpec.tags.map((tag) => (
            <article className="docs-tag" key={tag.name}>
              <h2>{tag.name}</h2>
              <p>{tag.description}</p>
            </article>
          ))}
        </section>

        <section className="docs-operations" aria-label="API endpoints">
          {operations.map(({ path, method, operation }) => (
            <EndpointCard key={`${method}-${path}`} path={path} method={method} operation={operation} />
          ))}
        </section>
      </div>
    </main>
  );
}
