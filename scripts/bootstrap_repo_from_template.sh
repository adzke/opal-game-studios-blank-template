#!/usr/bin/env bash
set -euo pipefail

TEMPLATE_REPO="adzke/opal-game-studios-blank-template"
VISIBILITY="private"
BASE_DIR="${HOME}/Documents/AD-Games"
REPO_NAME=""
OWNER=""
OPEN_BROWSER="true"
START_STACK="true"
DOCTOR_ONLY="false"

print_usage() {
    cat <<'EOF'
Create a new GitHub repository from template, clone it, start Docker, and open localhost.

Usage:
  bootstrap_repo_from_template.sh --name <repo-name> [options]

Options:
  --name, -n <repo-name>      New repository name (required unless using --doctor)
  --visibility <value>        private (default), public, or internal
  --base-dir <path>           Parent folder for the new project
  --owner <name>              Optional GitHub owner/org for repo creation
  --template <owner/repo>     Template source repository
  --doctor                    Check prerequisites and GitHub auth, then exit
  --no-open                   Do not open browser automatically
  --no-start                  Do not run docker compose up
  --help, -h                  Show this help text
EOF
}

log() {
    printf '[template-bootstrap] %s\n' "$1"
}

fail() {
    printf '[template-bootstrap] ERROR: %s\n' "$1" >&2
    exit 1
}

detect_platform() {
    case "$(uname -s)" in
        Darwin) printf 'macos' ;;
        Linux) printf 'linux' ;;
        CYGWIN*|MINGW*|MSYS*) printf 'windows' ;;
        *) printf 'unknown' ;;
    esac
}

tool_install_hint() {
    local tool="$1"
    local platform="$2"

    case "$platform:$tool" in
        macos:git) printf 'Install Git: https://git-scm.com/downloads/mac or `brew install git`' ;;
        macos:docker) printf 'Install Docker Desktop: https://docs.docker.com/desktop/setup/install/mac-install/' ;;
        macos:gh) printf 'Install GitHub CLI: https://cli.github.com/ or `brew install gh`' ;;
        linux:git) printf 'Install Git with your package manager (example: `sudo apt install -y git`)' ;;
        linux:docker) printf 'Install Docker Engine/Desktop: https://docs.docker.com/engine/install/' ;;
        linux:gh) printf 'Install GitHub CLI: https://github.com/cli/cli/blob/trunk/docs/install_linux.md' ;;
        windows:git) printf 'Install Git for Windows: https://git-scm.com/download/win or `winget install Git.Git`' ;;
        windows:docker) printf 'Install Docker Desktop: https://docs.docker.com/desktop/setup/install/windows-install/' ;;
        windows:gh) printf 'Install GitHub CLI: https://cli.github.com/ or `winget install GitHub.cli`' ;;
        *) printf 'Install %s and retry.' "$tool" ;;
    esac
}

print_missing_tools_guide() {
    local platform="$1"
    shift
    local missing_tools=("$@")

    printf '\n'
    log "We found missing prerequisites."
    printf 'Missing tools: %s\n' "${missing_tools[*]}"
    printf '\n'
    printf 'Follow these steps, then run this script again:\n'

    for tool in "${missing_tools[@]}"; do
        printf '1. %s\n' "$(tool_install_hint "$tool" "$platform")"
    done

    if [[ "$platform" == "macos" ]]; then
        printf '1. Optional shortcut: if Homebrew is installed, run `brew install git gh` then install Docker Desktop.\n'
    fi

    if [[ "$platform" == "windows" ]]; then
        printf '1. After installs finish, restart PowerShell/Terminal.\n'
    fi

    if [[ "$platform" == "linux" ]]; then
        printf '1. If Docker is newly installed, log out and log back in before retrying.\n'
    fi
}

print_docker_not_running_guide() {
    local platform="$1"

    printf '\n'
    log "Docker is installed but not running."

    case "$platform" in
        macos|windows)
            printf '1. Open Docker Desktop.\n'
            printf '1. Wait until it shows Docker is running.\n'
            printf '1. Re-run this script.\n'
            ;;
        linux)
            printf '1. Start Docker service: `sudo systemctl start docker`.\n'
            printf '1. Optional auto-start: `sudo systemctl enable docker`.\n'
            printf '1. Re-run this script.\n'
            ;;
        *)
            printf '1. Start Docker, then re-run this script.\n'
            ;;
    esac
}

open_url() {
    local url="$1"
    local platform="$2"

    case "$platform" in
        macos)
            open "$url" >/dev/null 2>&1 || return 1
            ;;
        linux)
            xdg-open "$url" >/dev/null 2>&1 || return 1
            ;;
        windows)
            cmd.exe /c start "" "$url" >/dev/null 2>&1 || return 1
            ;;
        *)
            return 1
            ;;
    esac

    return 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --name|-n)
            [[ $# -ge 2 ]] || fail "--name requires a value"
            REPO_NAME="$2"
            shift 2
            ;;
        --visibility)
            [[ $# -ge 2 ]] || fail "--visibility requires a value"
            VISIBILITY="$2"
            shift 2
            ;;
        --base-dir)
            [[ $# -ge 2 ]] || fail "--base-dir requires a value"
            BASE_DIR="$2"
            shift 2
            ;;
        --owner)
            [[ $# -ge 2 ]] || fail "--owner requires a value"
            OWNER="$2"
            shift 2
            ;;
        --template)
            [[ $# -ge 2 ]] || fail "--template requires a value"
            TEMPLATE_REPO="$2"
            shift 2
            ;;
        --doctor)
            DOCTOR_ONLY="true"
            shift
            ;;
        --no-open)
            OPEN_BROWSER="false"
            shift
            ;;
        --no-start)
            START_STACK="false"
            shift
            ;;
        --help|-h)
            print_usage
            exit 0
            ;;
        *)
            fail "Unknown argument: $1. Use --help for usage."
            ;;
    esac
done

if [[ "$DOCTOR_ONLY" != "true" ]]; then
    if [[ -z "$REPO_NAME" ]]; then
        read -r -p "New repository name (example: my-first-game): " REPO_NAME
    fi

    [[ -n "$REPO_NAME" ]] || fail "Repository name cannot be empty."
    [[ "$REPO_NAME" =~ ^[A-Za-z0-9._-]+$ ]] || fail "Repository name contains unsupported characters."
fi

case "$VISIBILITY" in
    private|public|internal) ;;
    *) fail "Visibility must be private, public, or internal." ;;
esac

platform="$(detect_platform)"
log "Detected platform: $platform"

missing_tools=()
for required_tool in git docker gh; do
    if ! command -v "$required_tool" >/dev/null 2>&1; then
        missing_tools+=("$required_tool")
    fi
done

if [[ ${#missing_tools[@]} -gt 0 ]]; then
    print_missing_tools_guide "$platform" "${missing_tools[@]}"
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    fail "Docker Compose is unavailable. Install Docker Desktop (or Docker Compose plugin) and retry."
fi

if ! docker info >/dev/null 2>&1; then
    print_docker_not_running_guide "$platform"
    exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
    log "GitHub CLI is not signed in. Starting browser sign-in now."
    gh auth login -w
fi

if ! gh auth status >/dev/null 2>&1; then
    fail "GitHub CLI authentication is still missing. Run 'gh auth login -w' and retry."
fi

if [[ "$DOCTOR_ONLY" == "true" ]]; then
    log "Doctor check complete. Prerequisites and GitHub auth look good."
    exit 0
fi

mkdir -p "$BASE_DIR"

TARGET_DIR="${BASE_DIR%/}/$REPO_NAME"
if [[ -e "$TARGET_DIR" ]]; then
    fail "Target folder already exists: $TARGET_DIR"
fi

REPO_SPEC="$REPO_NAME"
if [[ -n "$OWNER" ]]; then
    REPO_SPEC="${OWNER}/${REPO_NAME}"
fi

log "Creating repo '$REPO_SPEC' from template '$TEMPLATE_REPO' in '$BASE_DIR'."
pushd "$BASE_DIR" >/dev/null
gh repo create "$REPO_SPEC" --template "$TEMPLATE_REPO" --"$VISIBILITY" --clone
popd >/dev/null

[[ -d "$TARGET_DIR" ]] || fail "Repository was created, but local clone folder was not found at $TARGET_DIR"

if [[ "$START_STACK" == "true" ]]; then
    log "Starting local stack with docker compose."
    pushd "$TARGET_DIR" >/dev/null
    docker compose up --build -d
    popd >/dev/null
fi

if [[ "$OPEN_BROWSER" == "true" ]]; then
    if open_url "http://localhost:3000" "$platform"; then
        log "Opened http://localhost:3000 in your browser."
    else
        log "Could not auto-open browser. Open http://localhost:3000 manually."
    fi
fi

AUTH_USER="$OWNER"
if [[ -z "$AUTH_USER" ]]; then
    AUTH_USER="$(gh api user --jq .login 2>/dev/null || true)"
fi

printf '\n'
log "Setup complete."
printf 'Project folder: %s\n' "$TARGET_DIR"
if [[ -n "$AUTH_USER" ]]; then
    printf 'GitHub repo:   https://github.com/%s/%s\n' "$AUTH_USER" "$REPO_NAME"
fi
printf 'App URL:       http://localhost:3000\n'
printf '\n'
printf 'Useful commands:\n'
printf '  cd %q\n' "$TARGET_DIR"
printf '  docker compose logs -f\n'
printf '  docker compose down\n'
