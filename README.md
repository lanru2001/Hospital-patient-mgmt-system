# Hospital Patient Management System

FastAPI + React + AWS ECS Fargate + Terraform + GitHub Actions.

## Architecture

- **Backend**: FastAPI, SQLAlchemy, Postgres. JWT auth with RBAC (`admin` / `clinician` / `staff`).
  Every patient read/write is written to an `audit_logs` table (HIPAA access trail).
- **Frontend**: React (Vite) SPA in `frontend/`, styled as a chart/wristband
  metaphor — patient rows carry an allergy edge-tab, identifiers render in
  mono type. Talks to the backend over the `VITE_API_URL` env var. Hosted as
  a static site on S3 + CloudFront (see `terraform/frontend.tf`); a
  Dockerfile + nginx config are included as an alternative if you'd rather
  run it as an ECS service instead.
- **Compute**: ECS Fargate, 2+ tasks across 2 AZs, behind an internet-facing ALB.
  Tasks run in **private subnets**; only the ALB is public.
- **Data**: RDS Postgres, Multi-AZ, storage encrypted with a dedicated KMS key,
  30-day backups, Performance Insights + CloudWatch log export.
- **Secrets**: DB URL and JWT signing key live in Secrets Manager and are injected
  into the container at runtime — never in Terraform state output or plaintext env vars.
- **CI/CD**: GitHub Actions — test → Trivy image scan (fails on CRITICAL/HIGH) →
  build & push to ECR → render task definition → rolling ECS deploy. Auth to AWS
  is via OIDC federation (no stored access keys).

## First-time setup

1. **Remote state**: create the S3 bucket + DynamoDB table referenced in
   `terraform/main.tf` (`hospital-pms-tfstate`, `hospital-pms-tf-locks`).
2. **Terraform**:
```bash
   cd terraform
   terraform init
   terraform apply -var="github_repo=your-org/hospital-pms" -var="domain_name=api.yourhospital.com"
```
   This provisions the VPC, ECR repo, RDS instance, ECS cluster/service, ALB,
   and the GitHub OIDC deploy role.
3. **GitHub repo secrets**: add `AWS_ACCOUNT_ID` (used to build the OIDC role ARN),
   `API_URL` (public backend URL, baked into the frontend build),
   `FRONTEND_BUCKET` and `FRONTEND_DISTRIBUTION_ID` (from `terraform output`).
4. **DB migrations**: run once against the new DB (e.g. from a bastion, ECS Exec,
   or a one-off Fargate task):
```bash
   alembic upgrade head
```
5. Push to `main` — the pipeline builds, scans, and deploys both the API and the frontend.

## Local development

Backend:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hospital_pms
export JWT_SECRET=dev-secret
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to your backend, e.g. http://localhost:8000
npm run dev
```

## Compliance notes (read before going to production)

This scaffold implements common HIPAA-adjacent technical safeguards — encryption
at rest/in transit, private networking, audit logging, RBAC, no long-lived cloud
credentials — but **is not itself a compliance certification**. Before handling
real PHI you still need, at minimum:

- A signed **Business Associate Agreement (BAA)** with AWS.
- Field-level encryption or tokenization for identifiers like SSN.
- Formal access-review, incident-response, and breach-notification procedures.
- A WAF in front of the ALB, and a proper pen test.
- MFA enforcement for all IAM/human access paths.

## Next steps to harden further

- Add Alembic migration versions for the initial schema (currently model-driven).
- Add a WAF (`aws_wafv2_web_acl`) attached to the ALB.
- Add GuardDuty + Security Hub for continuous monitoring.
- Split staging/production into separate Terraform workspaces or state files.

Project layout
```bash
hospital-pms/
├── README.md
├── requirements.txt              # backend Python deps
├── Dockerfile                    # backend image (FastAPI + uvicorn)
├── .dockerignore
├── .gitignore
├── alembic.ini                   # migration tool config
│
├── alembic/
│   └── env.py                    # wires Alembic to app.database / app.models
│
├── app/                          # FastAPI backend
│   ├── __init__.py
│   ├── main.py                   # app entrypoint, mounts routers, /health
│   ├── config.py                 # env-driven settings (DATABASE_URL, JWT_SECRET, ...)
│   ├── database.py                # SQLAlchemy engine, session factory, get_db()
│   ├── models.py                  # User, Patient, AuditLog (SQLAlchemy ORM)
│   ├── schemas.py                 # Pydantic request/response models
│   ├── auth.py                    # password hashing, JWT create/decode
│   ├── dependencies.py            # get_current_user, require_role (RBAC)
│   └── routers/
│       ├── __init__.py
│       ├── auth.py                # POST /auth/login
│       └── patients.py            # /patients CRUD + audit logging
│
├── frontend/                     # React (Vite) SPA — "Chartline"
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example               # VITE_API_URL
│   ├── Dockerfile                 # optional: build + serve via nginx
│   ├── nginx.conf
│   └── src/
│       ├── main.jsx                # mounts <App/>, imports global CSS
│       ├── App.jsx                 # route table
│       ├── api/
│       │   └── client.js           # fetch wrapper (auth header, error handling)
│       ├── context/
│       │   └── AuthContext.jsx     # token storage, role decoding, login/logout
│       ├── components/
│       │   ├── ProtectedRoute.jsx  # redirects to /login if unauthenticated
│       │   └── Topbar.jsx          # app header, role badge, sign out
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── PatientList.jsx     # chart-tab list + search (route shell)
│       │   ├── PatientDetail.jsx   # chart record view
│       │   ├── PatientForm.jsx     # create/edit
│       │   └── PatientEmptyState.jsx
│       └── styles/
│           └── index.css           # design tokens + all component styles
│
├── iac/                    # infrastructure as code
│   ├── main.tf                    # provider, backend (S3 state), data sources
│   ├── variables.tf                # all input variables
│   ├── vpc.tf                      # VPC, public/private subnets, NAT, security groups
│   ├── ecr.tf                      # container registry for backend image
│   ├── rds.tf                      # Postgres (Multi-AZ, encrypted) + Secrets Manager
│   ├── alb.tf                      # load balancer, target group, HTTPS listener
│   ├── ecs.tf                      # cluster, task definition, service, autoscaling
│   ├── iam.tf                      # ECS execution/task roles (least privilege)
│   ├── frontend.tf                 # S3 + CloudFront static hosting for the SPA
│   ├── github_oidc.tf              # GitHub Actions deploy role (no stored AWS keys)
│   └── outputs.tf                  # ALB DNS, ECR URL, cluster/service names, etc.
│
└── .github/
    └── workflows/
        └── deploy.yml             # test → scan → deploy backend + deploy frontend
```

# GitHub repo Secrets (Settings → Secrets and variables → Actions → Secrets tab)
```bash
Name	            Value
AWS_ACCOUNT_ID |	  Your 12-digit AWS account ID, e.g. 123456789012
DOMAIN_NAME	    |   Your API domain, e.g. api.yourhospital.com — or leave it empty if you don't have one yet

That's the complete list for terraform.yml. Everything else it needs (github_repo) is filled in automatically from ${{ github.repository }}.
```
