describe("Auth integration", () => {
    const baseUrl = "http://localhost:3000";

    beforeEach(() => {
        cy.clearCookies();
        cy.clearLocalStorage();
    });

    it("Login: shows validation errors on empty submit", () => {
        cy.visit(`${baseUrl}/`);
        cy.contains("Sign in with Email Address").should("be.visible");

        cy.contains("button", "Sign In").click();

        cy.contains("Email is required").should("be.visible");
        cy.contains("Password is required").should("be.visible");
    });

    it("Login: toggles password visibility", () => {
        cy.visit(`${baseUrl}/`);

        cy.get('input[placeholder="Password"]')
            .should("have.attr", "type", "password");

        cy.get('button[aria-label="Show password"]').click();
        cy.get('input[placeholder="Password"]')
            .should("have.attr", "type", "text");

        cy.get('button[aria-label="Hide password"]').click();
        cy.get('input[placeholder="Password"]')
            .should("have.attr", "type", "password");
    });

    it("Login: successful login navigates to /files", () => {
        cy.intercept("POST", "**/api/user/login", {
            statusCode: 200,
            body: {
                data: {
                    firstname: "Athul",
                    lastname: "N",
                    id: 26,
                    email: "athul@test.com",
                    phonenumber: "123",
                    role: "admin",
                    community: ["A"],
                },
            },
        }).as("login");

        cy.visit(`${baseUrl}/`);

        cy.get('input[placeholder="Email address"]').type("athul@test.com");
        cy.get('input[placeholder="Password"]').type("secret12");
        cy.contains("button", "Sign In").click();

        cy.wait("@login");
        cy.location("pathname").should("eq", "/files");
    });

    it("Login: shows toast on API error", () => {
        cy.intercept("POST", "**/api/user/login", {
            statusCode: 401,
            body: { error: "Invalid credentials" },
        }).as("loginFail");

        cy.visit(`${baseUrl}/`);

        cy.get('input[placeholder="Email address"]').type("athul@test.com");
        cy.get('input[placeholder="Password"]').type("wrongpass");
        cy.contains("button", "Sign In").click();

        cy.wait("@loginFail");
        cy.contains("Invalid credentials").should("be.visible");
    });

    it("Login: forgot password opens reset modal", () => {
        cy.visit(`${baseUrl}/`);

        cy.contains("button", "Forgot password").click();
        cy.get('[data-testid="reset-modal"]').should("exist");
    });

    it("Login: Create New Account navigates to /signup", () => {
        cy.visit(`${baseUrl}/`);

        cy.contains("button", "Create New Account").click();
        cy.location("pathname").should("eq", "/signup");
    });

    it("Signup: calls communities API on mount and renders form", () => {
        cy.intercept("GET", "**/api/communities", {
            statusCode: 200,
            body: { communities: [{ name: "Shingwauk" }] },
        }).as("communities");

        cy.visit(`${baseUrl}/signup`);
        cy.wait("@communities");

        cy.contains("Create a new account").should("be.visible");
        cy.get('input[label="First name"]').should("not.exist");
        cy.contains("label", "First name").should("exist");
    });

    it("Signup: shows validation errors on empty submit", () => {
        cy.intercept("GET", "**/api/communities", {
            statusCode: 200,
            body: { communities: [] },
        }).as("communities");

        cy.visit(`${baseUrl}/signup`);
        cy.wait("@communities");

        cy.contains("button", /sign up/i).click();

        cy.contains("First name is required").should("be.visible");
        cy.contains("Last name is required").should("be.visible");
        cy.contains("Email is required").should("be.visible");
        cy.contains("Password is required").should("be.visible");
        cy.contains("Confirm Password is required").should("be.visible");
    });

    it("Signup: adds missing community then submits signup and navigates to /", () => {
        cy.intercept("GET", "**/api/user/me", { statusCode: 401, body: {} }).as("me");
        cy.intercept("POST", "**/api/user/refresh", { statusCode: 401, body: {} }).as("refresh");

        let communitiesCall = 0;
        cy.intercept("GET", "**/api/communities", (req) => {
            communitiesCall += 1;

            if (communitiesCall === 1) {
                req.reply({ statusCode: 200, body: { communities: [{ name: "Shingwauk" }] } });
                return;
            }

            req.reply({
                statusCode: 200,
                body: { communities: [{ name: "Shingwauk" }, { name: "NewComm" }] },
            });
        }).as("communities");

        cy.intercept("POST", "**/api/communities", (req) => {
            expect(req.body).to.deep.equal({ communities: ["NewComm"] });
            req.reply({ statusCode: 200, body: { ok: true } });
        }).as("addCommunity");

        cy.intercept("POST", "**/api/user/signup", (req) => {
            expect(req.body.community).to.deep.equal(["NewComm"]);
            req.reply({ statusCode: 200, body: { ok: true } });
        }).as("signup");

        cy.visit("/signup");
        cy.wait("@communities");

        cy.get('input[name="firstname"]').type("Athul");
        cy.get('input[name="lastname"]').type("N");
        cy.get('input[name="email"]').type("athul@test.com");
        cy.get('input[name="password"]').type("secret12");
        cy.get('input[name="confirmPassword"]').type("secret12");

        cy.get('input[placeholder="Search or type a community"]').first().type("NewComm{enter}");

        cy.contains("button", "SIGN UP").click();

        cy.wait("@addCommunity");
        cy.wait("@communities");
        cy.wait("@signup");

        cy.location("pathname").should("eq", "/");
    });


    it("AuthShared: OR divider is visible on login page", () => {
        cy.visit(`${baseUrl}/`);
        cy.contains("OR").should("be.visible");
    });
});
