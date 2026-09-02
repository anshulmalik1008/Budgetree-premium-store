import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const api = await prisma.externalApi.findFirst({
      orderBy: {
        id: "desc",
      },
    });

    if (!api) {
      return NextResponse.json({
        success: true,
        api: null,
      });
    }

    return NextResponse.json({
      success: true,
      api: {
        id: api.id,
        name: api.name,
        baseUrl: api.baseUrl,
        productsUrl: api.productsUrl,
        authType: api.authType,
        username: api.username,
        hasPassword: Boolean(api.password),
        hasApiKey: Boolean(api.apiKey),
        hasJwtToken: Boolean(api.jwtToken),
      },
    });
  } catch (error) {
    console.error("GET EXTERNAL API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load API settings",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();

    const baseUrl =
      String(body.baseUrl ?? "").trim();

    const productsUrl =
      String(body.productsUrl ?? "").trim();

    const authType =
      String(body.authType ?? "NONE")
        .trim()
        .toUpperCase();

    const username =
      body.username !== undefined &&
      body.username !== null
        ? String(body.username).trim()
        : "";

    const password =
      body.password !== undefined &&
      body.password !== null
        ? String(body.password)
        : "";

    const apiKey =
      body.apiKey !== undefined &&
      body.apiKey !== null
        ? String(body.apiKey)
        : "";

    const jwtToken =
      body.jwtToken !== undefined &&
      body.jwtToken !== null
        ? String(body.jwtToken).trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "API name is required",
        },
        { status: 400 }
      );
    }

    if (!productsUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Products API URL is required",
        },
        { status: 400 }
      );
    }

    const existing =
      await prisma.externalApi.findFirst({
        orderBy: {
          id: "desc",
        },
      });

    /*
     * Empty credentials ka matlab:
     * existing credential ko preserve karo.
     */
    const finalPassword =
      password ||
      existing?.password ||
      null;

    const finalApiKey =
      apiKey ||
      existing?.apiKey ||
      null;

    const finalJwtToken =
      jwtToken ||
      existing?.jwtToken ||
      null;

    let api;

    if (existing) {
      api = await prisma.externalApi.update({
        where: {
          id: existing.id,
        },

        data: {
          name,
          baseUrl: baseUrl || null,
          productsUrl,
          authType,
          username: username || null,
          password: finalPassword,
          apiKey: finalApiKey,
          jwtToken: finalJwtToken,
        },
      });
    } else {
      api = await prisma.externalApi.create({
        data: {
          name,
          baseUrl: baseUrl || null,
          productsUrl,
          authType,
          username: username || null,
          password: finalPassword,
          apiKey: finalApiKey,
          jwtToken: finalJwtToken,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "API settings saved successfully",

      api: {
        id: api.id,
        name: api.name,
        baseUrl: api.baseUrl,
        productsUrl: api.productsUrl,
        authType: api.authType,
      },
    });
  } catch (error) {
    console.error(
      "SAVE EXTERNAL API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save API settings",
      },
      { status: 500 }
    );
  }
}
