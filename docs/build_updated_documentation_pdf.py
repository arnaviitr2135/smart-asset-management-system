from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUT = Path(__file__).with_name("CultTrack_AI_Project_Documentation_Updated.pdf")

BLUE = colors.HexColor("#2E74B5")
DARK_BLUE = colors.HexColor("#1F4D78")
INK = colors.HexColor("#1F2937")
MUTED = colors.HexColor("#6B7280")
LIGHT = colors.HexColor("#F2F4F7")
SOFT_BLUE = colors.HexColor("#E8EEF5")
GREEN = colors.HexColor("#DFF3E8")
GOLD = colors.HexColor("#FFF3CD")


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=34,
        textColor=BLUE,
        alignment=TA_CENTER,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=16,
        leading=21,
        textColor=DARK_BLUE,
        alignment=TA_CENTER,
        spaceAfter=18,
    )
)
styles.add(
    ParagraphStyle(
        name="H1Custom",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=BLUE,
        spaceBefore=14,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="H2Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12.5,
        leading=16,
        textColor=BLUE,
        spaceBefore=9,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=INK,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="SmallCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.2,
        leading=11,
        textColor=INK,
    )
)


def p(text, style="BodyCustom"):
    return Paragraph(text, styles[style])


def bullet_list(items):
    return ListFlowable(
        [ListItem(p(item), leftIndent=12) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=18,
        bulletFontSize=6,
    )


def numbered_list(items):
    return ListFlowable(
        [ListItem(p(item), leftIndent=12) for item in items],
        bulletType="1",
        leftIndent=18,
    )


def table(headers, rows, widths):
    data = [[p(h, "SmallCustom") for h in headers]]
    for row in rows:
        data.append([p(str(cell), "SmallCustom") for cell in row])
    tbl = Table(data, colWidths=widths, repeatRows=1, hAlign="CENTER")
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D1D5DB")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return [tbl, Spacer(1, 8)]


def callout(title, body, fill=SOFT_BLUE):
    tbl = Table(
        [[p(f"<b>{title}</b><br/>{body}", "SmallCustom")]],
        colWidths=[6.35 * inch],
        hAlign="CENTER",
    )
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#BFC7D5")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return [tbl, Spacer(1, 8)]


def h1(text):
    return [Paragraph(text, styles["H1Custom"])]


def h2(text):
    return [Paragraph(text, styles["H2Custom"])]


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(inch, 0.55 * inch, "CultTrack AI Project Documentation")
    canvas.drawRightString(7.5 * inch, 0.55 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.85 * inch,
        bottomMargin=0.8 * inch,
    )
    story = []

    story.append(p("CultTrack AI", "CoverTitle"))
    story.append(p("Smart Asset Management and Resource Allocation Platform", "CoverSubtitle"))
    story.append(p("Updated Project Documentation", "CoverSubtitle"))
    story += callout(
        "Project Scope",
        "A full-stack web application for the Cultural Council of IIT Roorkee that centralizes inventory, booking requests, approvals, handovers, returns, audit logs, email notifications, password recovery, QR-assisted operations, analytics, and demand forecasting.",
    )
    story += table(
        ["Field", "Details"],
        [
            ("Submitted By", "Yash Sharma (24116108), Arnav Saini (24116015)"),
            ("Department", "Electronics and Communication Engineering, IIT Roorkee"),
            ("Repository", "https://github.com/arnaviitr2135/smart-asset-management-system"),
            ("Frontend", "https://frontend-seven-lyart-83.vercel.app"),
            ("Backend API", "https://smart-asset-management-system-oiyh.onrender.com"),
            ("Local Run", "docker compose up --build"),
            ("Last Updated", "12 June 2026"),
        ],
        [1.5 * inch, 4.85 * inch],
    )
    story.append(PageBreak())

    story += h1("1. Problem Understanding")
    story += h2("1.1 Background and Context")
    story.append(
        p(
            "The Cultural Council of IIT Roorkee manages a large pool of high-value shared assets used by sections, societies, and event teams. These assets include cameras, studio lights, recording equipment, sound systems, costumes, props, and event infrastructure. Because the same equipment moves between many students and events, the Council needs reliable visibility into who has an item, when it is due back, whether it is damaged, and whether it is available for a future event."
        )
    )
    story += h2("1.2 Manual Workflow Problems")
    story.append(
        bullet_list(
            [
                "Separate spreadsheets maintained by different coordinators.",
                "Physical logbooks for check-ins and check-outs.",
                "Informal handovers coordinated through messages, calls, and word of mouth.",
                "No reliable real-time view of availability across upcoming dates.",
                "No permanent digital trail for accountability, condition, and return history.",
            ]
        )
    )
    story += h2("1.3 Operational Pain Points")
    story.append(
        bullet_list(
            [
                "Overbooking during major events because overlapping requests are hard to detect manually.",
                "Stock visibility gaps where an item appears available in one sheet but is physically checked out.",
                "Lost accountability for damaged or missing accessories.",
                "Slow issue and return operations during physical handovers.",
                "No analytics for utilization, shortage prediction, or purchase planning.",
            ]
        )
    )

    story += h1("2. Proposed Solution")
    story.append(
        p(
            "CultTrack AI replaces the fragmented manual system with a centralized portal. Members browse inventory and request resources, while admins use a control desk for approvals, issue, return, inventory management, health reports, notifications, analytics, and audit history."
        )
    )
    story += table(
        ["Objective", "Implementation"],
        [
            ("Prevent overbooking", "Date-aware availability checks compare requested quantity against approved reservations and active loans without double-counting."),
            ("Improve accountability", "Bookings, approvals, issues, returns, health reports, and admin actions are persisted and audited."),
            ("Speed operations", "Admin desk, QR simulation, and focused check-in views reduce manual searching."),
            ("Improve communication", "In-app and email notifications keep users/admins updated."),
            ("Support planning", "Analytics and forecasting expose utilization and shortage risk."),
        ],
        [1.7 * inch, 4.65 * inch],
    )

    story += h1("3. Complete Feature Inventory")
    story += table(
        ["Area", "Features", "Users"],
        [
            ("Authentication", "JWT login, registration, role-based sessions, protected routes.", "All"),
            ("Password Recovery", "Forgot password, reset token, reset screen, privacy-safe response.", "All"),
            ("Email", "Resend API, Gmail SMTP fallback, reset and workflow emails.", "All"),
            ("Inventory Catalog", "Search, categories, shelf counts, active/maintenance/damaged states.", "Members"),
            ("Date Availability", "Availability endpoint and modal count for selected dates.", "Members"),
            ("Booking Requests", "Quantity/date/purpose validation and pending request queue.", "Members/Admins"),
            ("Approval Desk", "Approve/reject requests and reserve physical stock.", "Admins"),
            ("Issue/Handover", "Approved bookings become allocations with due dates and issuing admin.", "Admins"),
            ("Return Requests", "Member return button, admin return request, return log, user confirmation.", "All"),
            ("Final Check-in", "Condition on return, inventory restoration, damaged item maintenance.", "Admins"),
            ("Health Logs", "Damage and maintenance reporting.", "Admins"),
            ("QR Simulation", "QR payloads and scan simulation for fast lookup.", "Admins"),
            ("Notifications", "Unread count, notification center, mark-read action.", "All"),
            ("Audit Trail", "Permanent history of important actions.", "Admins"),
            ("Analytics", "Metrics, utilization, active loans, overdue counts, forecast data.", "Admins"),
            ("Deployment", "Docker, Vercel, Render, Neon.", "Developers"),
        ],
        [1.25 * inch, 4.1 * inch, 1.0 * inch],
    )

    story += h1("4. User Roles and Workflows")
    story += h2("4.1 Society Member Workflow")
    story.append(
        numbered_list(
            [
                "Register or log in.",
                "Browse inventory by search/category.",
                "Open an asset request modal and choose quantity, dates, and purpose.",
                "Review Available for selected dates before submitting.",
                "Submit booking and track status in Bookings and Loans.",
                "Use Return Asset on issued loans or confirm admin return requests.",
                "Receive in-app and email notifications.",
            ]
        )
    )
    story += h2("4.2 Council Admin Workflow")
    story.append(
        numbered_list(
            [
                "Log in as admin.",
                "Create/update inventory assets.",
                "Review pending requests and approve/reject.",
                "Issue approved assets during handover.",
                "Monitor active loans and due dates.",
                "Request users to return assets when needed.",
                "Complete check-in with condition and notes.",
                "Review health logs, audit logs, analytics, and forecasts.",
            ]
        )
    )

    story += h1("5. System Architecture")
    story += table(
        ["Layer", "Technology", "Responsibility"],
        [
            ("Frontend", "React, Vite, TypeScript, Tailwind, Recharts", "UI for catalog, bookings, loans, admin desk, analytics, auth."),
            ("Backend", "Node.js, Express, TypeScript", "REST API, validation, RBAC, booking logic, notifications."),
            ("ORM", "Prisma", "Type-safe schema and PostgreSQL access."),
            ("Database", "PostgreSQL", "Users, assets, bookings, allocations, returns, logs, tokens."),
            ("Local Runtime", "Docker Compose", "Frontend, backend, and DB with seed data."),
            ("Production", "Vercel, Render, Neon", "Frontend hosting, backend Docker service, database."),
        ],
        [1.2 * inch, 2.0 * inch, 3.15 * inch],
    )

    story += h1("6. Database Schema")
    story += table(
        ["Model", "Purpose", "Important Fields"],
        [
            ("User", "Member and admin accounts.", "email, passwordHash, fullName, role"),
            ("Asset", "Inventory items.", "name, category, quantityAvailable, totalQuantity, status"),
            ("Booking", "Initial member request.", "userId, assetId, quantity, dates, purpose, status"),
            ("Allocation", "Issued active loan.", "bookingId, userId, issuedById, dueDate, status"),
            ("Return", "Completed return/check-in.", "allocationId, receivedById, conditionOnReturn"),
            ("ReturnRequest", "Return coordination.", "allocationId, source, status, notes"),
            ("AssetHealthReport", "Damage and maintenance.", "assetId, reportedById, condition, notes"),
            ("Notification", "In-app alerts.", "userId, title, message, isRead"),
            ("AuditLog", "Action history.", "userId, action, details, createdAt"),
            ("PasswordResetToken", "Password reset security.", "userId, tokenHash, expiresAt"),
        ],
        [1.25 * inch, 2.1 * inch, 3.0 * inch],
    )

    story += h1("7. API Overview")
    story += table(
        ["Route Group", "Key Endpoints", "Purpose"],
        [
            ("Auth", "/register, /login, /forgot-password, /reset-password, /me", "Accounts and sessions."),
            ("Assets", "GET /assets, GET /:id, GET /:id/availability, POST/PUT/DELETE", "Inventory and date availability."),
            ("Bookings", "POST /bookings, GET /bookings, PUT /:id/approve, /reject", "Requests and admin review."),
            ("Allocations", "GET /allocations, POST /issue, POST /return", "Issue and return check-in."),
            ("Return Requests", "POST /request-return, GET /return-requests, POST /:id/respond", "Return coordination."),
            ("Health", "POST/GET /allocations/health", "Damage and maintenance logs."),
            ("Analytics", "GET /analytics, GET /analytics/forecast", "Metrics and forecasting."),
            ("Audit", "GET /audit", "Admin action history."),
            ("Notifications", "GET /notifications, PUT /:id/read", "Notification center."),
            ("Health Check", "GET /healthz", "Backend/database status."),
        ],
        [1.25 * inch, 3.35 * inch, 1.75 * inch],
    )

    story += h1("8. Booking and Availability Logic")
    story.append(
        bullet_list(
            [
                "Catalog cards show current shelf stock, for example 4 / 8 in stock.",
                "The request modal calls /api/v1/assets/:id/availability for the selected dates.",
                "The backend prevents double-counting by treating approved bookings as the reservation source and not counting their issued allocations again.",
                "The request API validates quantity, date order, non-past start dates, date availability, and current shelf availability.",
                "Returns restore quantityAvailable and mark allocations as RETURNED.",
            ]
        )
    )

    story += h1("9. Notifications, Email, and Password Reset")
    story += table(
        ["Capability", "Behavior"],
        [
            ("In-app notifications", "Unread count and notification feed for booking and return events."),
            ("Email provider", "Resend API preferred; Gmail SMTP fallback supported."),
            ("Password reset", "Reset token is created, hashed in DB, emailed, and expires."),
            ("Privacy", "Forgot-password response does not reveal whether an email is registered."),
            ("Logs", "Render logs show Resend, SMTP, skipped, or error states."),
        ],
        [1.7 * inch, 4.65 * inch],
    )

    story += h1("10. Analytics and Forecasting")
    story.append(
        p(
            "The admin dashboard summarizes operational data and uses a lightweight weekly weighted moving-average style forecast to identify shortage risk without heavy machine-learning infrastructure."
        )
    )
    story.append(
        bullet_list(
            [
                "Dashboard metrics for assets, bookings, issued loans, overdue loans, and utilization.",
                "Forecast endpoint based on past booking/allocation activity.",
                "Shortage warnings when projected demand approaches available inventory.",
                "Recharts visualizations in the admin analytics UI.",
            ]
        )
    )

    story += h1("11. Local Setup and Deployment")
    story += callout(
        "Docker Command",
        "git clone https://github.com/arnaviitr2135/smart-asset-management-system.git<br/>cd smart-asset-management-system<br/>docker compose up --build",
        LIGHT,
    )
    story += table(
        ["Service", "URL", "Notes"],
        [
            ("Frontend", "http://localhost:5173", "Vite React app."),
            ("Backend", "http://localhost:5000", "Express API."),
            ("Health", "http://localhost:5000/healthz", "API and DB check."),
            ("Production Frontend", "https://frontend-seven-lyart-83.vercel.app", "Vercel."),
            ("Production Backend", "https://smart-asset-management-system-oiyh.onrender.com", "Render."),
            ("Production DB", "Neon PostgreSQL", "Managed database."),
        ],
        [1.4 * inch, 2.8 * inch, 2.15 * inch],
    )

    story += h1("12. Environment Variables")
    story += table(
        ["Variable", "Used By", "Purpose"],
        [
            ("DATABASE_URL", "Backend", "PostgreSQL/Neon connection string."),
            ("JWT_SECRET", "Backend", "JWT signing secret."),
            ("PORT", "Backend", "API port."),
            ("FRONTEND_URL", "Backend", "Reset links and allowed frontend origin."),
            ("RESEND_API_KEY", "Backend", "Email API key."),
            ("RESEND_FROM", "Backend", "Sender identity."),
            ("SMTP_USER / SMTP_PASS", "Backend", "Gmail fallback."),
            ("VITE_API_URL", "Frontend", "Render backend URL."),
        ],
        [1.55 * inch, 1.2 * inch, 3.6 * inch],
    )

    story += h1("13. Security, Reliability, and Troubleshooting")
    story.append(
        bullet_list(
            [
                "Passwords are stored as bcrypt hashes.",
                "JWT protects authenticated routes.",
                "Admin-only routes are guarded by role middleware.",
                "Password reset tokens are hashed and expire.",
                "Secrets are stored in environment variables, not committed.",
                "Audit logs preserve important operational actions.",
            ]
        )
    )
    story += table(
        ["Issue", "Likely Cause", "Resolution"],
        [
            ("Frontend cannot reach backend", "Wrong VITE_API_URL or Render sleep/down.", "Check /healthz and Vercel env vars."),
            ("Forgot password email missing", "Email not registered or email provider env missing.", "Check Render logs for Password Reset, Resend, SMTP, Email Error."),
            ("Wrong availability count", "Backend not deployed to latest availability fix.", "Deploy latest Render commit and use modal Available for selected dates."),
            ("Render Dockerfile error", "Wrong Dockerfile/build context.", "Use backend/Dockerfile.render and backend context."),
            ("Local stale data", "Old Docker volume.", "docker compose down -v, then docker compose up --build."),
        ],
        [1.7 * inch, 2.1 * inch, 2.55 * inch],
    )

    story += h1("14. Future Enhancements")
    story.append(
        bullet_list(
            [
                "Real QR scanner using device camera APIs.",
                "Calendar view for asset reservations.",
                "Exportable semester audit and budget reports.",
                "Verified production email domain for stronger deliverability.",
                "Fine-grained society/team ownership and approval policies.",
                "Automated overdue reminders and escalation workflows.",
            ]
        )
    )

    story.append(Spacer(1, 18))
    story.append(p("<b>End of Updated Project Documentation</b>", "BodyCustom"))
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(OUT)


if __name__ == "__main__":
    build()
