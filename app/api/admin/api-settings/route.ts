import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =========================================================
   GET ALL EXTERNAL APIs
========================================================= */

export async function GET() {
  try {
    const apis = await prisma.externalApi.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Password/API key frontend ko kabhi return nahi karna
    const safeApis = apis.map((api) => ({
      id: api.id,
      name: api.name,
      baseUrl: api.baseUrl,
      productsUrl: api.productsUrl,
      authType: api.authType,
      username: api.username,
      active: api.active,
      createdAt: api.createdAt,
      updatedAt: api.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      apis: safeApis,
    });
  } catch (error) {
    console.error("GET EXTERNAL APIs ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch external APIs",
        apis: [],
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE EXTERNAL API
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const baseUrl = String(body.baseUrl ?? "").trim();
    const productsUrl = String(body.productsUrl ?? "").trim();

    const authType = String(
      body.authType ?? "NONE"
    )
      .trim()
      .toUpperCase();

    const username =
      body.username !== undefined &&
      body.username !== null
        ? String(body.username).trim()
        : null;

    const password =
      body.password !== undefined &&
      body.password !== null
        ? String(body.password)
        : null;

    const apiKey =
      body.apiKey !== undefined &&
      body.apiKey !== null
        ? String(body.apiKey)
        : null;

    const active =
      body.active === undefined
        ? true
        : Boolean(body.active);

    /* =====================================================
       VALIDATION
    ===================================================== */

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

    try {
      new URL(productsUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Products API URL",
        },
        { status: 400 }
      );
    }

    if (baseUrl) {
      try {
        new URL(baseUrl);
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid Base URL",
          },
          { status: 400 }
        );
      }
    }

    const allowedAuthTypes = [
      "NONE",
      "BASIC",
      "BEARER",
      "API_KEY",
    ];

    if (!allowedAuthTypes.includes(authType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid authentication type",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       BASIC AUTH VALIDATION
    ===================================================== */

    if (authType === "BASIC") {
      if (!username || !password) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Username and password are required for Basic Auth",
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       BEARER VALIDATION
    ===================================================== */

    if (authType === "BEARER") {
      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Bearer token is required",
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       API KEY VALIDATION
    ===================================================== */

    if (authType === "API_KEY") {
      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            message:
              "API key is required",
          },
          { status: 400 }
        );
      }
    }

    /* =====================================================
       CREATE
    ===================================================== */

    const api = await prisma.externalApi.create({
      data: {
        name,
        baseUrl,
        productsUrl,
        authType,
        username:
          authType === "BASIC"
            ? username
            : null,
        password:
          authType === "BASIC"
            ? password
            : null,
        apiKey:
          authType === "BEARER" ||
          authType === "API_KEY"
            ? apiKey
            : null,
        active,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "External API added successfully",
        api: {
          id: api.id,
          name: api.name,
          baseUrl: api.baseUrl,
          productsUrl: api.productsUrl,
          authType: api.authType,
          username: api.username,
          active: api.active,
          createdAt: api.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE EXTERNAL API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add external API",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE EXTERNAL API
========================================================= */

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid API ID is required",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.externalApi.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "External API not found",
        },
        { status: 404 }
      );
    }

    const name =
      body.name !== undefined
        ? String(body.name).trim()
        : existing.name;

    const baseUrl =
      body.baseUrl !== undefined
        ? String(body.baseUrl).trim()
        : existing.baseUrl;

    const productsUrl =
      body.productsUrl !== undefined
        ? String(body.productsUrl).trim()
        : existing.productsUrl;

    const authType =
      body.authType !== undefined
        ? String(body.authType)
            .trim()
            .toUpperCase()
        : existing.authType;

    const active =
      body.active !== undefined
        ? Boolean(body.active)
        : existing.active;

    const username =
      body.username !== undefined
        ? String(body.username).trim()
        : existing.username;

    const password =
      body.password !== undefined
        ? String(body.password)
        : existing.password;

    const apiKey =
      body.apiKey !== undefined
        ? String(body.apiKey)
        : existing.apiKey;

    if (!name || !productsUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "API name and Products URL are required",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.externalApi.update({
      where: { id },
      data: {
        name,
        baseUrl,
        productsUrl,
        authType,
        username:
          authType === "BASIC"
            ? username
            : null,
        password:
          authType === "BASIC"
            ? password
            : null,
        apiKey:
          authType === "BEARER" ||
          authType === "API_KEY"
            ? apiKey
            : null,
        active,
      },
    });

    return NextResponse.json({
      success: true,
      message: "External API updated successfully",
      api: {
        id: updated.id,
        name: updated.name,
        baseUrl: updated.baseUrl,
        productsUrl: updated.productsUrl,
        authType: updated.authType,
        username: updated.username,
        active: updated.active,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE EXTERNAL API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update external API",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE EXTERNAL API
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const id = Number(
      searchParams.get("id")
    );

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid API ID is required",
        },
        { status: 400 }
      );
    }

    await prisma.externalApi.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "External API deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE EXTERNAL API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete external API",
      },
      { status: 500 }
    );
  }
}
