import { NextResponse } from "next/server";
import { openApiSpec } from "@/src/lib/openapi-spec";

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
  });
}
