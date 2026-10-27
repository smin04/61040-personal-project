import {
  createApp,
  onMounted,
  computed,
  onUnmounted,
  ref,
} from "vue/dist/vue.esm-bundler.js";

interface Connection {
  connection: string;
  peer: string;
}

interface PendingRequest {
  request: string;
  requester: string;
}

interface Intention {
  intention: string;
  item: string;
  name: string;
  reference: string;
}

interface SharedIntention {
  peer: string;
  item: string;
  name: string;
  reference: string;
}

type PlanResponse =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED";

interface Plan {
  plan: string;
  item: string;
  name: string;
  reference: string;
  organizer: string;
  participants: string[];
  response: PlanResponse;
  time: string;
  status:
    | "PROPOSED"
    | "COMMITTED"
    | "CANCELLED"
    | "COMPLETED";
}

interface Home {
  connections: Connection[];
  pendingRequests: PendingRequest[];
  intentions: Intention[];
  sharedIntentions: SharedIntention[];
  plans: Plan[];
}

const FRIENDLY_ERRORS: Record<string, string> = {
  INVALID_USERNAME:
    "Use 3 to 32 letters, numbers, underscores, or hyphens for your username.",
  WEAK_PASSWORD:
    "Password must be at least 8 characters.",
  USERNAME_TAKEN:
    "That username is already taken. Try another one.",
  INVALID_CREDENTIALS:
    "The username or password is incorrect.",
  UNKNOWN_SESSION:
    "Your session expired. Please sign in again.",
  CANNOT_CONNECT_SELF:
    "You cannot connect with yourself.",
  ALREADY_CONNECTED:
    "You are already connected with that person.",
  REQUEST_EXISTS:
    "You already sent this person a request.",
  REQUEST_NOT_FOUND:
    "That connection request no longer exists.",
  NOT_REQUEST_RECIPIENT:
    "Only the person who received the request can respond to it.",
  CONNECTION_NOT_FOUND:
    "That connection no longer exists.",
  NOT_CONNECTION_MEMBER:
    "You are not part of that connection.",
  ALREADY_INTENDING:
    "You already saved that activity.",
  INTENTION_NOT_FOUND:
    "That saved activity is no longer active.",
  ORGANIZER_NOT_PARTICIPANT:
    "The organizer has to be included in the plan.",
  TOO_FEW_PARTICIPANTS:
    "A plan needs at least two people.",
  PLAN_NOT_FOUND:
    "That plan no longer exists.",
  PLAN_NOT_PROPOSED:
    "That plan is no longer waiting for responses.",
  NOT_PARTICIPANT:
    "Only someone in the plan can do that.",
  INVALID_RESPONSE:
    "Choose Accept or Decline.",
  NOT_ALL_ACCEPTED:
    "The plan cannot be committed until everyone accepts.",
  PLAN_CLOSED:
    "That plan is already closed.",
  PLAN_NOT_COMMITTED:
    "Only a committed plan can be marked done.",
};

let session =
  sessionStorage.getItem(
    "weshould-session",
  );

function readableError(
  path: string,
  raw: unknown,
  body: Record<string, unknown>,
): string {
  if (typeof raw !== "string") {
    return "Something went wrong. Please try again.";
  }

  const exact =
    FRIENDLY_ERRORS[raw];

  if (exact) {
    return exact;
  }

  if (
    path === "/auth/register" &&
    raw === "CONFLICT"
  ) {
    return "That username is already taken. Try another one.";
  }

  if (
    path === "/auth/register" &&
    raw === "INVALID_REQUEST"
  ) {
    const suppliedUsername =
      typeof body.username === "string"
        ? body.username
        : "";

    const suppliedPassword =
      typeof body.password === "string"
        ? body.password
        : "";

    if (
      !/^[A-Za-z0-9_-]{3,32}$/.test(
        suppliedUsername,
      )
    ) {
      return "Use 3 to 32 letters, numbers, underscores, or hyphens for your username.";
    }

    if (
      suppliedPassword.length < 8 ||
      suppliedPassword.length > 128
    ) {
      return "Password must be between 8 and 128 characters.";
    }

    return "Check your username and password and try again.";
  }

  if (
    path === "/auth/sign-in" &&
    raw === "UNAUTHORIZED"
  ) {
    return "The username or password is incorrect.";
  }

  if (
    path === "/connections/request" &&
    raw === "CONFLICT"
  ) {
    return "You are already connected with this person or already sent them a request.";
  }

  if (
    path === "/connections/request" &&
    raw === "INVALID_REQUEST"
  ) {
    return "That connection request is not valid. Check the username and try again.";
  }

  if (
    (
      path === "/connections/accept" ||
      path === "/connections/decline"
    ) &&
    raw === "NOT_FOUND"
  ) {
    return "That connection request no longer exists.";
  }

  if (
    path === "/connections/disconnect" &&
    raw === "NOT_FOUND"
  ) {
    return "That connection no longer exists.";
  }

  if (
    path === "/connections/disconnect" &&
    raw === "FORBIDDEN"
  ) {
    return "You are not part of that connection.";
  }

  if (
    path === "/intentions/express" &&
    raw === "CONFLICT"
  ) {
    return "You already saved this activity.";
  }

  if (
    path === "/intentions/express" &&
    raw === "INVALID_REQUEST"
  ) {
    return "Add an activity name and a full http or https link.";
  }

  if (
    path === "/plans/propose" &&
    raw === "INVALID_REQUEST"
  ) {
    return "Choose a shared activity and enter a time for the plan.";
  }

  if (
    path === "/plans/respond" &&
    raw === "CONFLICT"
  ) {
    return "That plan is no longer waiting for responses.";
  }

  if (
    path === "/plans/respond" &&
    raw === "FORBIDDEN"
  ) {
    return "Only someone included in the plan can respond.";
  }

  if (
    path === "/plans/cancel" &&
    raw === "CONFLICT"
  ) {
    return "That plan is already closed.";
  }

  if (
    path === "/plans/cancel" &&
    raw === "FORBIDDEN"
  ) {
    return "Only someone included in the plan can cancel it.";
  }

  if (
    path === "/plans/complete" &&
    raw === "CONFLICT"
  ) {
    return "This plan cannot be marked done yet. It may still be waiting for acceptance or already be closed.";
  }

  if (
    path === "/plans/complete" &&
    raw === "FORBIDDEN"
  ) {
    return "Only someone included in the plan can mark it done.";
  }

  if (raw === "UNAUTHORIZED") {
    return "Your session expired. Please sign in again.";
  }

  if (raw === "FORBIDDEN") {
    return "You do not have permission to do that.";
  }

  if (raw === "NOT_FOUND") {
    return "That item could not be found. Refresh and try again.";
  }

  if (raw === "CONFLICT") {
    return "That action conflicts with the current state. Refresh and try again.";
  }

  if (raw === "INVALID_REQUEST") {
    return "Some of that information is invalid. Check the form and try again.";
  }

  return "Something went wrong. Please try again.";
}

async function api(
  path: string,
  body: Record<string, unknown> = {},
): Promise<any> {
  const isPublicAuth =
    path === "/auth/register" ||
    path === "/auth/sign-in";

  const requestBody =
    !isPublicAuth && session
      ? {
          ...body,
          session,
        }
      : body;

  const response =
    await fetch(
      `/api${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          requestBody,
        ),
      },
    );

  const result =
    (await response.json()) as Record<
      string,
      unknown
    >;

  if (!response.ok) {
    throw new Error(
      readableError(
        path,
        result.error,
        requestBody,
      ),
    );
  }

  return result;
}

function validHttpUrl(
  value: string,
): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

const app = createApp({
  setup() {
    const username = ref("");
    const password = ref("");

    const signedInUser =
      ref<string | null>(null);

    const error = ref("");
    const authError = ref("");
    const captureError = ref("");
    const connectionError = ref("");
    const planError = ref("");
    const notice = ref("");
    const loading = ref(false);

    const connectionUsername =
      ref("");

    const activityName = ref("");
    const activityUrl = ref("");

    // Incoming links are suggestions, never automatically saved.
    const incoming = new URLSearchParams(window.location.search).get("share");
    if (incoming && validHttpUrl(incoming)) {
      activityUrl.value = incoming;
      const sharedName = new URLSearchParams(window.location.search).get("name");
      if (sharedName) activityName.value = sharedName.slice(0, 120);
    }

    const selectedPlanItem =
      ref("");

    const selectedPlanName =
      ref("");

    const selectedPlanPeers = ref<string[]>([]);
    const selectedEligiblePeers = ref<string[]>([]);

    const planTime = ref("");

    const home =
      ref<Home | null>(null);

    let refreshTimer:
      number | undefined;

    let noticeTimer:
      number | undefined;

    function showNotice(
      message: string,
    ) {
      notice.value = message;

      if (
        noticeTimer !== undefined
      ) {
        window.clearTimeout(
          noticeTimer,
        );
      }

      noticeTimer =
        window.setTimeout(
          () => {
            notice.value = "";
          },
          3200,
        );
    }

    type ErrorScope =
      | "global"
      | "auth"
      | "capture"
      | "connection"
      | "plan";

    function clearScopedError(
      scope: ErrorScope,
    ) {
      if (scope === "auth") {
        authError.value = "";
      } else if (scope === "capture") {
        captureError.value = "";
      } else if (scope === "connection") {
        connectionError.value = "";
      } else if (scope === "plan") {
        planError.value = "";
      } else {
        error.value = "";
      }
    }

    function setScopedError(
      scope: ErrorScope,
      message: string,
    ) {
      if (scope === "auth") {
        authError.value = message;
      } else if (scope === "capture") {
        captureError.value = message;
      } else if (scope === "connection") {
        connectionError.value = message;
      } else if (scope === "plan") {
        planError.value = message;
      } else {
        error.value = message;
      }
    }

    async function run(
      action: () => Promise<void>,
      successMessage = "",
      scope: ErrorScope = "global",
    ) {
      error.value = "";
      clearScopedError(scope);
      notice.value = "";
      loading.value = true;

      try {
        await action();

        if (successMessage) {
          showNotice(
            successMessage,
          );
        }
      } catch (caught) {
        setScopedError(
          scope,
          caught instanceof Error
            ? caught.message
            : "Something went wrong. Please try again.",
        );
      } finally {
        loading.value = false;
      }
    }

    async function loadHome() {
      if (!session) {
        return;
      }

      const result =
        await api("/home");

      home.value =
        result.home as Home;
    }

    async function quietRefresh() {
      if (
        !session ||
        !signedInUser.value ||
        loading.value
      ) {
        return;
      }

      try {
        await loadHome();
      } catch {
        // Explicit user actions surface errors.
      }
    }

    async function currentUser() {
      if (!session) {
        signedInUser.value = null;
        home.value = null;
        return;
      }

      try {
        const result =
          await api(
            "/auth/current",
          );

        signedInUser.value =
          result.username;

        await loadHome();
      } catch {
        session = null;

        sessionStorage.removeItem(
          "weshould-session",
        );

        signedInUser.value = null;
        home.value = null;
      }
    }

    async function register() {
      await run(
        async () => {
          const trimmedUsername =
            username.value.trim();

          if (
            !/^[A-Za-z0-9_-]{3,32}$/.test(
              trimmedUsername,
            )
          ) {
            throw new Error(
              "Use 3 to 32 letters, numbers, underscores, or hyphens for your username.",
            );
          }

          if (
            password.value.length < 8 ||
            password.value.length > 128
          ) {
            throw new Error(
              "Password must be between 8 and 128 characters.",
            );
          }

          const result =
            await api(
              "/auth/register",
              {
                username:
                  trimmedUsername,
                password:
                  password.value,
              },
            );

          session = result.session;

          sessionStorage.setItem(
            "weshould-session",
            session!,
          );

          signedInUser.value =
            result.account;

          password.value = "";

          await loadHome();
        },
        "Account created.",
        "auth",
      );
    }

    async function signIn() {
      await run(
        async () => {
          const result =
            await api(
              "/auth/sign-in",
              {
                username:
                  username.value.trim(),
                password:
                  password.value,
              },
            );

          session = result.session;

          sessionStorage.setItem(
            "weshould-session",
            session!,
          );

          signedInUser.value =
            result.account;

          password.value = "";

          await loadHome();
        },
        "Signed in.",
        "auth",
      );
    }

    async function signOut() {
      await run(async () => {
        if (session) {
          await api(
            "/auth/sign-out",
          );
        }

        session = null;

        sessionStorage.removeItem(
          "weshould-session",
        );

        signedInUser.value = null;
        home.value = null;
      });
    }

    async function requestConnection() {
      await run(
        async () => {
          const recipient =
            connectionUsername.value.trim();

          if (!recipient) {
            throw new Error(
              "Enter your friend's username.",
            );
          }

          if (
            signedInUser.value &&
            recipient.toLowerCase() ===
              signedInUser.value.toLowerCase()
          ) {
            throw new Error(
              "You cannot connect with yourself.",
            );
          }

          await api(
            "/connections/request",
            {
              recipient,
            },
          );

          connectionUsername.value = "";

          await loadHome();
        },
        "Connection request sent.",
        "connection",
      );
    }

    async function acceptConnection(
      request: string,
    ) {
      await run(
        async () => {
          await api(
            "/connections/accept",
            {
              request,
            },
          );

          await loadHome();
        },
        "Connected.",
        "connection",
      );
    }

    async function declineConnection(
      request: string,
    ) {
      await run(
        async () => {
          await api(
            "/connections/decline",
            {
              request,
            },
          );

          await loadHome();
        },
        "Request declined.",
        "connection",
      );
    }

    async function disconnect(
      connection: string,
    ) {
      await run(
        async () => {
          await api(
            "/connections/disconnect",
            {
              connection,
            },
          );

          await loadHome();
        },
        "Connection removed.",
        "connection",
      );
    }

    async function expressIntention() {
      await run(
        async () => {
          const name =
            activityName.value.trim();

          const reference =
            activityUrl.value.trim();

          if (!name) {
            throw new Error(
              "Give the activity a name.",
            );
          }

          if (!validHttpUrl(reference)) {
            throw new Error(
              "Paste a full link starting with http:// or https://.",
            );
          }

          await api(
            "/intentions/express",
            {
              name,
              reference,
            },
          );

          activityName.value = "";
          activityUrl.value = "";

          await loadHome();
        },
        "Saved to your I'd Go list.",
        "capture",
      );
    }

    const groupedShared = computed(() => {
      const groups = new Map<string, {item:string; name:string; reference:string; peers:string[]}>();
      for (const shared of home.value?.sharedIntentions ?? []) {
        const group = groups.get(shared.item) ?? {item:shared.item, name:shared.name, reference:shared.reference, peers:[]};
        if (!group.peers.includes(shared.peer)) group.peers.push(shared.peer);
        groups.set(shared.item, group);
      }
      return [...groups.values()];
    });

    function choosePlan(
      shared: {item:string; name:string; reference:string; peers:string[]},
    ) {
      selectedPlanItem.value =
        shared.item;

      selectedPlanName.value =
        shared.name;

      selectedEligiblePeers.value = [...shared.peers];
      selectedPlanPeers.value = [...shared.peers];

      planTime.value = "";
      planError.value = "";

      window.requestAnimationFrame(
        () => {
          document
            .getElementById(
              "plan-composer",
            )
            ?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
        },
      );
    }

    function toggleInvitee(peer: string) {
      if (selectedPlanPeers.value.includes(peer)) {
        selectedPlanPeers.value = selectedPlanPeers.value.filter(
          (selected) => selected !== peer,
        );
      } else {
        selectedPlanPeers.value = [...selectedPlanPeers.value, peer];
      }
    }

    function displayParticipant(user: string): string {
      return user === signedInUser.value ? "You" : `@${user}`;
    }

    function clearPlanDraft() {
      selectedPlanItem.value = "";
      selectedPlanName.value = "";
      selectedPlanPeers.value = [];
      selectedEligiblePeers.value = [];
      planTime.value = "";
      planError.value = "";
    }

    async function proposePlan() {
      await run(
        async () => {
          if (
            !signedInUser.value ||
            !selectedPlanItem.value ||
            selectedPlanPeers.value.length === 0
          ) {
            throw new Error(
              "Choose a shared activity first.",
            );
          }

          if (!planTime.value.trim()) {
            throw new Error(
              "Add a time for the plan.",
            );
          }

          await api(
            "/plans/propose",
            {
              item:
                selectedPlanItem.value,
              participants: [
                signedInUser.value,
                ...selectedPlanPeers.value,
              ],
              time:
                planTime.value.trim(),
            },
          );

          clearPlanDraft();

          await loadHome();
        },
        "Plan proposed.",
        "plan",
      );
    }

    async function respondToPlan(
      plan: string,
      response:
        | "ACCEPTED"
        | "DECLINED",
    ) {
      await run(
        async () => {
          await api(
            "/plans/respond",
            {
              plan,
              response,
            },
          );

          await loadHome();
        },
        response === "ACCEPTED"
          ? "You're in."
          : "Plan declined.",
        "plan",
      );
    }

    async function cancelPlan(
      plan: string,
    ) {
      await run(
        async () => {
          await api(
            "/plans/cancel",
            {
              plan,
            },
          );

          await loadHome();
        },
        "Plan cancelled. The underlying idea is still saved.",
        "plan",
      );
    }

    async function completePlan(
      plan: string,
    ) {
      await run(
        async () => {
          await api(
            "/plans/complete",
            {
              plan,
            },
          );

          await loadHome();
        },
        "Done. That idea has moved from someday to did it.",
        "plan",
      );
    }

    function displayReference(
      reference: string,
    ): string {
      try {
        const url =
          new URL(reference);

        return url.hostname.replace(
          /^www\./,
          "",
        );
      } catch {
        return "original link";
      }
    }

    function prettyStatus(
      status: Plan["status"],
    ): string {
      switch (status) {
        case "PROPOSED":
          return "Waiting";
        case "COMMITTED":
          return "Everyone's in";
        case "COMPLETED":
          return "Done";
        case "CANCELLED":
          return "Cancelled";
      }
    }

    onMounted(() => {
      void currentUser();

      refreshTimer =
        window.setInterval(
          () => {
            void quietRefresh();
          },
          1500,
        );
    });

    onUnmounted(() => {
      if (
        refreshTimer !== undefined
      ) {
        window.clearInterval(
          refreshTimer,
        );
      }

      if (
        noticeTimer !== undefined
      ) {
        window.clearTimeout(
          noticeTimer,
        );
      }
    });

    return {
      toggleInvitee,
      displayParticipant,
      username,
      password,
      signedInUser,
      error,
      authError,
      captureError,
      connectionError,
      planError,
      notice,
      loading,
      connectionUsername,
      activityName,
      activityUrl,
      selectedPlanItem,
      selectedPlanName,
      selectedPlanPeers,
      selectedEligiblePeers,
      groupedShared,
      planTime,
      home,
      register,
      signIn,
      signOut,
      requestConnection,
      acceptConnection,
      declineConnection,
      disconnect,
      expressIntention,
      choosePlan,
      clearPlanDraft,
      proposePlan,
      respondToPlan,
      cancelPlan,
      completePlan,
      displayReference,
      prettyStatus,
    };
  },

  template: `
    <main class="page" :aria-busy="loading">
      <header class="topbar">
        <a class="identity" href="#top" aria-label="WeShould home">
          <div class="logo-mark">W</div>

          <div class="brand-copy">
            <div class="brand">WeShould</div>
            <div class="tagline">Save the spark. Make it real.</div>
          </div>
        </a>

        <div v-if="signedInUser" class="signed-in">
          <span class="username-pill">@{{ signedInUser }}</span>

          <button
            class="button ghost-button small-button"
            type="button"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </header>

      <div id="top"></div>

      <div
        v-if="error"
        class="message error"
        role="alert"
        aria-live="assertive"
      >
        <span class="message-dot"></span>
        {{ error }}
      </div>

      <div
        v-if="notice"
        class="message notice"
        role="status"
        aria-live="polite"
      >
        <span class="message-dot"></span>
        {{ notice }}
      </div>

      <section v-if="!signedInUser" class="auth-shell">
        <div class="auth-intro">
          <div class="eyebrow">A place for the plans that almost happen</div>

          <h1 class="display-title auth-display">
            Keep the idea.<br />
            Find the overlap.<br />
            Pick a night.
          </h1>

          <p class="lede">
            WeShould holds onto restaurants, concerts, classes, and places you would genuinely go. When a friend independently saves the same thing, that is when planning starts.
          </p>
        </div>

        <div class="auth-card">
          <div class="card-kicker">Sign in to your list</div>

          <label>
            Username
            <input
              v-model="username"
              placeholder="josie"
              autocomplete="username"
              maxlength="32"
              :aria-invalid="Boolean(authError)"
              :aria-describedby="authError ? 'auth-error' : undefined"
              @input="authError = ''"
              @keyup.enter="signIn"
            />
          </label>

          <label>
            Password
            <input
              v-model="password"
              type="password"
              placeholder="At least 8 characters"
              autocomplete="current-password"
              maxlength="128"
              :aria-invalid="Boolean(authError)"
              :aria-describedby="authError ? 'auth-error' : undefined"
              @input="authError = ''"
              @keyup.enter="signIn"
            />
          </label>

          <div
            v-if="authError"
            id="auth-error"
            class="inline-error"
            role="alert"
          >
            <span class="inline-error-icon" aria-hidden="true">!</span>
            <span>{{ authError }}</span>
          </div>

          <div class="auth-actions">
            <button
              class="button primary-button"
              :disabled="loading || !username.trim() || !password"
              @click="signIn"
            >
              Sign in
            </button>

            <button
              class="button secondary-button"
              :disabled="loading || !username.trim() || !password"
              @click="register"
            >
              Create account
            </button>
          </div>

          <p class="microcopy">
            Accounts use a username and password so the deployed beta can be tested without a Commons account.
          </p>
        </div>
      </section>

      <template v-else>
        <section class="hero">
          <div class="hero-copy">
            <div class="eyebrow">Your someday list, with a way forward</div>

            <h1 class="display-title">
              What should you actually do?
            </h1>

            <p class="lede">
              Save the idea while it is fresh. WeShould waits to introduce coordination until someone you know is in too.
            </p>
          </div>

          <div class="capture-card">
            <div class="capture-number">01</div>

            <div class="capture-copy">
              <div class="card-kicker">I'd Go</div>
              <h2>Save the spark.</h2>
              <p>
                Paste the link you just found. No date, invitation, or group-chat negotiation yet.
              </p>
            </div>

            <label class="field-label">
              Activity name
              <input
                v-model="activityName"
                placeholder="Wally's Cafe"
                maxlength="160"
                :aria-invalid="Boolean(captureError)"
                :aria-describedby="captureError ? 'capture-error' : undefined"
                @input="captureError = ''"
              />
            </label>

            <label class="field-label">
              Link
              <input
                v-model="activityUrl"
                type="url"
                inputmode="url"
                placeholder="https://..."
                :aria-invalid="Boolean(captureError)"
                :aria-describedby="captureError ? 'capture-error' : undefined"
                @input="captureError = ''"
                @keyup.enter="expressIntention"
              />
            </label>

            <div
              v-if="captureError"
              id="capture-error"
              class="inline-error"
              role="alert"
            >
              <span class="inline-error-icon" aria-hidden="true">!</span>
              <span>{{ captureError }}</span>
            </div>

            <button
              class="button spark-button full-button"
              :disabled="loading || !activityName.trim() || !activityUrl.trim()"
              @click="expressIntention"
            >
              I'd Go
              <span aria-hidden="true">+</span>
            </button>
          </div>
        </section>

        <section class="summary-strip" aria-label="WeShould summary">
          <div class="summary-item">
            <span class="summary-number">{{ home?.intentions?.length || 0 }}</span>
            <span class="summary-label">saved ideas</span>
          </div>

          <div class="summary-item accent-summary">
            <span class="summary-number">{{ groupedShared.length }}</span>
            <span class="summary-label">shared sparks</span>
          </div>

          <div class="summary-item">
            <span class="summary-number">{{ home?.plans?.filter((plan) => plan.status === 'COMMITTED').length || 0 }}</span>
            <span class="summary-label">plans happening</span>
          </div>
        </section>

        <section class="match-section">
          <div class="section-intro">
            <div>
              <div class="eyebrow plum-eyebrow">02 · YOU'D BOTH GO</div>
              <h2 class="section-title">There is a reason to make this real.</h2>
            </div>

            <span class="count-badge">{{ groupedShared.length }}</span>
          </div>

          <div
            v-if="!groupedShared.length"
            class="empty-card match-empty"
          >
            <div class="empty-symbol">✦</div>
            <div>
              <strong>No shared spark yet.</strong>
              <p>
                Keep saving things you would actually do. When a connection independently saves the same activity, it appears here.
              </p>
            </div>
          </div>

          <div v-else class="match-grid">
            <article
              v-for="shared in groupedShared"
              :key="shared.item"
              class="match-card"
            >
              <div class="match-badge">New overlap</div>

              <div class="match-people">
                <span class="avatar avatar-you">{{ signedInUser?.slice(0, 1).toUpperCase() }}</span>
                <span class="avatar avatar-peer">{{ shared.peers[0]?.slice(0, 1).toUpperCase() }}</span>
                <span>You + {{ shared.peers.map(p => "@" + p).join(", ") }}</span>
              </div>

              <div class="match-name">{{ shared.name }}</div>

              <a
                class="reference-link light-link"
                :href="shared.reference"
                :title="'Open ' + displayReference(shared.reference)"
                target="_blank"
                rel="noreferrer"
              >
                View original
                <span aria-hidden="true">↗</span>
              </a>

              <button
                class="button spark-button match-action"
                @click="choosePlan(shared)"
              >
                Make a plan
                <span aria-hidden="true">→</span>
              </button>
            </article>
          </div>
        </section>

        <div class="content-grid">
          <section class="paper-card saved-card">
            <div class="section-intro compact-intro">
              <div>
                <div class="eyebrow">01 · I'D GO</div>
                <h2 class="section-title smaller-title">Ideas worth keeping</h2>
              </div>

              <span class="count-badge quiet-count">{{ home?.intentions?.length || 0 }}</span>
            </div>

            <div
              v-if="!home?.intentions?.length"
              class="empty-card flat-empty"
            >
              <strong>Your list is empty.</strong>
              <p>Add the first place or activity above.</p>
            </div>

            <div v-else class="saved-list">
              <article
                v-for="intention in home?.intentions || []"
                :key="intention.intention"
                class="saved-row"
              >
                <div>
                  <div class="item-name">{{ intention.name }}</div>
                  <a
                    class="reference-link"
                    :href="intention.reference"
                    :title="'Open ' + displayReference(intention.reference)"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View original
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>

                <span class="saved-state">Saved</span>
              </article>
            </div>
          </section>

          <section class="paper-card people-card">
            <div class="section-intro compact-intro">
              <div>
                <div class="eyebrow">YOUR PEOPLE</div>
                <h2 class="section-title smaller-title">Connections</h2>
              </div>
            </div>

            <div class="connection-form">
              <label class="sr-only" for="connection-username">Friend's username</label>
              <input
                id="connection-username"
                v-model="connectionUsername"
                placeholder="Friend's username"
                maxlength="32"
                :aria-invalid="Boolean(connectionError)"
                :aria-describedby="connectionError ? 'connection-error' : undefined"
                @input="connectionError = ''"
                @keyup.enter="requestConnection"
              />

              <button
                class="button plum-button compact-button"
                :disabled="loading || !connectionUsername.trim()"
                @click="requestConnection"
              >
                Add
              </button>
            </div>

            <div
              v-if="connectionError"
              id="connection-error"
              class="inline-error connection-inline-error"
              role="alert"
            >
              <span class="inline-error-icon" aria-hidden="true">!</span>
              <span>{{ connectionError }}</span>
            </div>

            <div
              v-if="home?.pendingRequests?.length"
              class="requests"
            >
              <div class="mini-heading">Requests</div>

              <article
                v-for="request in home?.pendingRequests || []"
                :key="request.request"
                class="person-row"
              >
                <div class="person">
                  <div class="avatar">{{ request.requester.slice(0, 1).toUpperCase() }}</div>
                  <div>
                    <strong>@{{ request.requester }}</strong>
                    <div class="meta">wants to connect</div>
                  </div>
                </div>

                <div class="row-actions">
                  <button
                    class="button plum-button compact-button"
                    @click="acceptConnection(request.request)"
                  >
                    Accept
                  </button>

                  <button
                    class="button text-button compact-button"
                    @click="declineConnection(request.request)"
                  >
                    Decline
                  </button>
                </div>
              </article>
            </div>

            <div
              v-if="!home?.connections?.length"
              class="empty-card flat-empty"
            >
              <p>Add a friend so WeShould can notice when your lists overlap.</p>
            </div>

            <article
              v-for="connection in home?.connections || []"
              :key="connection.connection"
              class="person-row"
            >
              <div class="person">
                <div class="avatar">{{ connection.peer.slice(0, 1).toUpperCase() }}</div>
                <div>
                  <strong>@{{ connection.peer }}</strong>
                  <div class="meta">Connected</div>
                </div>
              </div>

              <button
                class="button text-button compact-button"
                @click="disconnect(connection.connection)"
              >
                Disconnect
              </button>
            </article>
          </section>
        </div>

        <section
          id="plan-composer"
          class="plan-composer"
          :class="{ 'plan-composer-active': selectedPlanItem }"
        >
          <div class="composer-heading">
            <div class="composer-step">03</div>

            <div class="composer-copy">
              <div class="eyebrow plum-eyebrow">MAKE IT REAL</div>
              <h2 class="section-title">Pick one concrete time.</h2>
              <p>
                Planning starts after the overlap is real. Pick a time, invite one or more friends, and let everyone respond.
              </p>
            </div>
          </div>

          <div
            v-if="!selectedPlanItem"
            class="composer-placeholder"
          >
            <div class="placeholder-kicker">Nothing selected yet</div>
            <strong>Start from a shared spark above.</strong>
            <p>Choose <b>Make a plan</b> and the activity will appear here ready to schedule.</p>
          </div>

          <div
            v-else
            class="composer-panel"
          >
            <div class="selected-activity">
              <div class="selected-topline">You + {{ selectedPlanPeers.map(p => "@" + p).join(", ") }}</div>
              <div class="selected-name">{{ selectedPlanName }}</div>
              <div class="group-invitees" role="group" aria-label="Invite friends">
                <div class="group-invitees-title">Invite friends who saved this activity</div>
                <div class="invitee-grid">
                  <button
                    v-for="peer in selectedEligiblePeers"
                    :key="peer"
                    type="button"
                    class="invitee-pill"
                    :class="{ 'invitee-pill-selected': selectedPlanPeers.includes(peer) }"
                    :aria-pressed="selectedPlanPeers.includes(peer)"
                    @click="toggleInvitee(peer)"
                  >
                    <span class="invitee-check" aria-hidden="true">{{ selectedPlanPeers.includes(peer) ? '✓' : '+' }}</span>
                    <span>@{{ peer }}</span>
                  </button>
                </div>
                <small class="invitee-help">Invitees do not need to know one another. Everyone must accept.</small>
              </div>
              <div class="selected-caption">You already agree on the idea. Now just pick a time.</div>
            </div>

            <label class="plan-time-field">
              <span>When should you go?</span>
              <input
                v-model="planTime"
                class="plan-time-input"
                placeholder="Friday at 8 PM"
                maxlength="256"
                autocomplete="off"
                :aria-invalid="Boolean(planError)"
                :aria-describedby="planError ? 'plan-error' : 'plan-time-help'"
                @input="planError = ''"
                @keyup.enter="proposePlan"
              />
              <small id="plan-time-help">For example: Saturday brunch, Thursday after class, Oct 24 at 7 PM.</small>
            </label>

            <div
              v-if="planError"
              id="plan-error"
              class="inline-error plan-inline-error"
              role="alert"
            >
              <span class="inline-error-icon" aria-hidden="true">!</span>
              <span>{{ planError }}</span>
            </div>

            <div class="composer-actions">
              <button
                class="button spark-button propose-button"
                :disabled="loading || !planTime.trim() || !selectedPlanPeers.length"
                @click="proposePlan"
              >
                Propose this time
                <span aria-hidden="true">→</span>
              </button>

              <button
                class="button text-button"
                @click="clearPlanDraft"
              >
                Never mind
              </button>
            </div>
          </div>
        </section>

        <section class="plans-section">
          <div
            v-if="planError && !selectedPlanItem"
            class="inline-error plans-inline-error"
            role="alert"
          >
            <span class="inline-error-icon" aria-hidden="true">!</span>
            <span>{{ planError }}</span>
          </div>

          <div class="section-intro">
            <div>
              <div class="eyebrow plum-eyebrow">FROM MAYBE TO HAPPENING</div>
              <h2 class="section-title">Plans</h2>
            </div>

            <span class="count-badge">{{ home?.plans?.length || 0 }}</span>
          </div>

          <div
            v-if="!home?.plans?.length"
            class="empty-card plans-empty"
          >
            <strong>No plans yet.</strong>
            <p>A shared idea becomes a plan when someone picks a time.</p>
          </div>

          <div v-else class="plans-list">
            <article
              v-for="plan in home?.plans || []"
              :key="plan.plan"
              class="plan-card"
              :class="'plan-' + plan.status.toLowerCase()"
            >
              <div class="plan-status-line">
                <span
                  class="status"
                  :class="'status-' + plan.status.toLowerCase()"
                >
                  {{ prettyStatus(plan.status) }}
                </span>

                <span class="plan-owner">
                  <template v-if="plan.organizer === signedInUser">
                    You proposed this
                  </template>
                  <template v-else>
                    Proposed by @{{ plan.organizer }}
                  </template>
                </span>
              </div>

              <div class="plan-name">{{ plan.name }}</div>
              <div class="plan-participants" aria-label="People invited to this plan">
                <span v-for="participant in plan.participants || [plan.organizer]" :key="participant" class="participant-pill">
                  <span class="participant-avatar" aria-hidden="true">{{ participant.slice(0, 1).toUpperCase() }}</span>
                  {{ displayParticipant(participant) }}
                </span>
              </div>
              <div v-if="plan.participants?.length > 2" class="plan-group-note">
                Group plan · {{ plan.participants.length }} people invited
              </div>


              <a
                class="reference-link"
                :href="plan.reference"
                :title="'Open ' + displayReference(plan.reference)"
                target="_blank"
                rel="noreferrer"
              >
                View original
                <span aria-hidden="true">↗</span>
              </a>

              <div class="plan-time">{{ plan.time }}</div>

              <div
                v-if="plan.status === 'PROPOSED' && plan.organizer === signedInUser"
                class="plan-footer"
              >
                <div class="waiting-copy">Waiting for invited people to respond.</div>

                <button
                  class="button text-button compact-button"
                  @click="cancelPlan(plan.plan)"
                >
                  Cancel plan
                </button>
              </div>

              <div
                v-else-if="plan.status === 'PROPOSED' && plan.response === 'PENDING'"
                class="plan-footer"
              >
                <div class="waiting-copy">Are you in?</div>

                <div class="row-actions">
                  <button
                    class="button spark-button compact-button"
                    @click="respondToPlan(plan.plan, 'ACCEPTED')"
                  >
                    Accept
                  </button>

                  <button
                    class="button text-button compact-button"
                    @click="respondToPlan(plan.plan, 'DECLINED')"
                  >
                    Decline
                  </button>
                </div>
              </div>

              <div
                v-else-if="plan.status === 'PROPOSED' && plan.response === 'ACCEPTED'"
                class="plan-footer"
              >
                <div class="waiting-copy">You're in. Waiting for everyone else.</div>
              </div>

              <div
                v-else-if="plan.status === 'PROPOSED' && plan.response === 'DECLINED'"
                class="plan-footer"
              >
                <div class="waiting-copy">You declined this plan.</div>
              </div>

              <div
                v-if="plan.status === 'COMMITTED'"
                class="plan-footer committed-footer"
              >
                <div class="committed-copy">It's happening.</div>

                <div class="row-actions">
                  <button
                    class="button plum-button compact-button"
                    @click="completePlan(plan.plan)"
                  >
                    Mark done
                  </button>

                  <button
                    class="button text-button compact-button"
                    @click="cancelPlan(plan.plan)"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div
                v-if="plan.status === 'COMPLETED'"
                class="plan-footer completed-footer"
              >
                <div class="finished-copy">✓ You did it.</div>
              </div>

              <div
                v-if="plan.status === 'CANCELLED'"
                class="plan-footer cancelled-footer"
              >
                <div class="finished-copy muted">This plan was cancelled. The original idea stays saved.</div>
              </div>
            </article>
          </div>
        </section>
      </template>
    </main>
  `,
});

app.mount("#app");

const style =
  document.createElement("style");

style.textContent = `

  .group-invitees {
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 20px;
    padding: 20px;
    margin: 20px 0;
    background: rgba(255,255,255,.04);
  }
  .group-invitees-title { font-weight: 750; color: #fff; margin-bottom: 14px; }
  .invitee-grid { display: flex; flex-wrap: wrap; gap: 10px; }
  .invitee-pill {
    appearance: none; display: inline-flex; align-items: center; gap: 10px;
    min-height: 44px; padding: 8px 15px 8px 8px; border-radius: 100px;
    border: 1px solid rgba(255,255,255,.22);
    background: rgba(255,255,255,.1); color: #fff; cursor: pointer;
    font: inherit; font-weight: 600; max-width: 100%; overflow-wrap: anywhere;
  }
  .invitee-pill-selected { border-color: var(--citron); background: rgba(215,242,58,.17); }
  .invitee-pill:focus-visible { outline: 3px solid var(--citron); outline-offset: 3px; }
  .invitee-check {
    flex: 0 0 28px; width: 28px; height: 28px; display: grid; place-items: center;
    background: rgba(255,255,255,.18); border-radius: 50%; font-size: 16px;
  }
  .invitee-pill-selected .invitee-check { background: var(--citron); color: var(--plum); }
  .invitee-help { display: block; margin-top: 15px; color: rgba(255,255,255,.8); line-height: 1.4; }
  .plan-participants { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
  .participant-pill {
    display: inline-flex; align-items: center; gap: 7px; border-radius: 100px;
    background: rgba(47,29,47,.08); color: var(--plum);
    padding: 7px 12px; font-size: .9rem; font-weight: 650;
  }
  .participant-avatar {
    display: grid; place-items: center; width: 23px; height: 23px;
    border-radius: 50%; background: var(--lilac); font-size: .75rem;
  }
  .plan-group-note { font-size: .85rem; color: var(--muted); margin: 0 0 10px; }

  :root {
    --ivory: #f5f0e6;
    --paper: #fffdf8;
    --plum: #2f1d2f;
    --plum-2: #5f2857;
    --muted-plum: #7a356d;
    --citron: #d7f23a;
    --sage: #93a178;
    --sage-soft: #e6ebdc;
    --coral: #d16b47;
    --coral-soft: #fae9e2;
    --lilac: #d9cde8;
    --ink: #2a202a;
    --muted: #756d75;
    --line: #ded7cd;
    --shadow: 0 24px 70px rgba(47, 29, 47, 0.08);
  }

  * {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    margin: 0;
    background:
      radial-gradient(circle at 78% 4%, rgba(215, 242, 58, 0.11), transparent 22rem),
      radial-gradient(circle at 9% 31%, rgba(217, 205, 232, 0.22), transparent 24rem),
      var(--ivory);
    color: var(--ink);
    font-family:
      Inter,
      ui-sans-serif,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  a {
    color: inherit;
  }

  button,
  input {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  button:focus-visible,
  input:focus-visible,
  a:focus-visible {
    outline: 3px solid var(--citron);
    outline-offset: 3px;
  }

  .page {
    width: min(1180px, calc(100% - 48px));
    margin: 0 auto;
    padding: 24px 0 96px;
  }

  .topbar {
    position: sticky;
    top: 12px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    width: min(100%, 1160px);
    padding: 11px 14px;
    margin-bottom: 54px;
    border: 1px solid rgba(47, 29, 47, 0.1);
    border-radius: 22px;
    background: rgba(255, 253, 248, 0.91);
    box-shadow: 0 12px 34px rgba(47, 29, 47, 0.06);
    backdrop-filter: blur(18px);
  }

  .identity {
    display: flex;
    align-items: center;
    gap: 11px;
    text-decoration: none;
  }

  .logo-mark {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 12px 12px 12px 4px;
    background: var(--muted-plum);
    color: white;
    font-family: Fraunces, Georgia, serif;
    font-size: 24px;
    font-weight: 700;
  }

  .brand {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .tagline {
    margin-top: 1px;
    color: var(--muted);
    font-size: 11px;
  }

  .signed-in,
  .row-actions,
  .composer-actions,
  .auth-actions {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .username-pill {
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--lilac);
    color: var(--plum);
    font-size: 12px;
    font-weight: 800;
  }

  .eyebrow,
  .card-kicker,
  .mini-heading {
    color: var(--muted);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .plum-eyebrow {
    color: var(--muted-plum);
  }

  .display-title,
  .section-title,
  .match-name,
  .plan-name,
  .selected-name {
    font-family: Fraunces, Georgia, serif;
  }

  .display-title {
    max-width: 760px;
    margin: 10px 0 18px;
    font-size: clamp(52px, 7vw, 86px);
    line-height: 0.94;
    letter-spacing: -0.055em;
    font-weight: 700;
  }

  .lede {
    max-width: 620px;
    margin: 0;
    color: var(--muted);
    font-size: 17px;
    line-height: 1.6;
  }

  .message {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 12px 14px;
    margin: -32px 0 24px;
    border-radius: 13px;
    font-size: 12px;
    font-weight: 700;
  }

  .message-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  .error {
    border: 1px solid rgba(209, 107, 71, 0.4);
    background: var(--coral-soft);
    color: #8c432b;
  }

  .notice {
    border: 1px solid rgba(147, 161, 120, 0.45);
    background: var(--sage-soft);
    color: #50613b;
  }

  .inline-error {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 11px 12px;
    margin: 10px 0 2px;
    border: 1px solid rgba(209, 107, 71, 0.34);
    border-radius: 12px;
    background: var(--coral-soft);
    color: #81412f;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.4;
  }

  .inline-error-icon {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 19px;
    height: 19px;
    margin-top: -1px;
    border-radius: 50%;
    background: #d16b47;
    color: white;
    font-size: 11px;
    font-weight: 900;
  }

  .connection-inline-error {
    margin: 2px 0 12px;
  }

  .plan-inline-error {
    margin-top: 12px;
  }

  .plans-inline-error {
    margin: 0 0 18px;
  }

  input[aria-invalid="true"] {
    border-color: #c96b4d;
    box-shadow: 0 0 0 3px rgba(209, 107, 71, 0.1);
  }

  .auth-shell {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(340px, 0.65fr);
    gap: 64px;
    min-height: 70vh;
    align-items: center;
  }

  .auth-display {
    font-size: clamp(48px, 6.4vw, 78px);
  }

  .auth-card,
  .paper-card,
  .capture-card {
    border: 1px solid var(--line);
    background: rgba(255, 253, 248, 0.94);
    box-shadow: var(--shadow);
  }

  .auth-card {
    padding: 30px;
    border-radius: 28px;
  }

  label,
  .field-label {
    display: grid;
    gap: 7px;
    margin: 16px 0;
    color: #5f565f;
    font-size: 12px;
    font-weight: 700;
  }

  input {
    width: 100%;
    min-height: 48px;
    padding: 12px 14px;
    border: 1px solid #d9d1c8;
    border-radius: 13px;
    background: #fffefa;
    color: var(--ink);
    outline: none;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  input::placeholder {
    color: #aaa1aa;
  }

  input:focus {
    border-color: var(--muted-plum);
    box-shadow: 0 0 0 3px rgba(122, 53, 109, 0.11);
  }

  .button {
    min-height: 44px;
    border: 0;
    border-radius: 999px;
    padding: 11px 18px;
    font-weight: 800;
    transition:
      transform 120ms ease,
      background 120ms ease,
      opacity 120ms ease;
  }

  .button:not(:disabled):active {
    transform: translateY(1px);
  }

  .button:disabled {
    cursor: default;
    opacity: 0.4;
  }

  .primary-button,
  .plum-button {
    background: var(--plum);
    color: white;
  }

  .primary-button:hover:not(:disabled),
  .plum-button:hover:not(:disabled) {
    background: #432943;
  }

  .secondary-button {
    background: #eee7dd;
    color: var(--plum);
  }

  .ghost-button,
  .text-button {
    border: 1px solid rgba(47, 29, 47, 0.13);
    background: transparent;
    color: var(--plum);
  }

  .text-button {
    min-height: 36px;
    padding: 7px 11px;
    font-size: 11px;
  }

  .spark-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: var(--citron);
    color: #211b20;
  }

  .spark-button:hover:not(:disabled) {
    background: #e0fa4f;
  }

  .small-button {
    min-height: 38px;
    padding: 8px 13px;
    font-size: 11px;
  }

  .compact-button {
    min-height: 38px;
    padding: 8px 13px;
    font-size: 11px;
  }

  .full-button {
    width: 100%;
  }

  .microcopy {
    margin: 15px 0 0;
    color: #8c838b;
    font-size: 10px;
    line-height: 1.5;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.68fr);
    gap: 58px;
    align-items: end;
    margin-bottom: 28px;
  }

  .capture-card {
    position: relative;
    padding: 26px;
    border-radius: 28px;
    overflow: hidden;
  }

  .capture-card::after {
    content: "";
    position: absolute;
    right: -70px;
    top: -70px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(215, 242, 58, 0.22);
    pointer-events: none;
  }

  .capture-number {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    margin-bottom: 18px;
    border-radius: 50%;
    background: var(--plum);
    color: white;
    font-size: 11px;
    font-weight: 800;
  }

  .capture-copy h2 {
    margin: 5px 0 7px;
    font-family: Fraunces, Georgia, serif;
    font-size: 31px;
    letter-spacing: -0.035em;
  }

  .capture-copy p {
    margin: 0 0 12px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.55;
  }

  .summary-strip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    margin: 24px 0 48px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--line);
  }

  .summary-item {
    display: flex;
    align-items: baseline;
    gap: 9px;
    padding: 17px 20px;
    background: rgba(255, 253, 248, 0.92);
  }

  .accent-summary {
    background: rgba(217, 205, 232, 0.48);
  }

  .summary-number {
    font-family: Fraunces, Georgia, serif;
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }

  .summary-label {
    color: var(--muted);
    font-size: 11px;
  }

  .match-section,
  .plans-section {
    margin: 48px 0;
  }

  .section-intro {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .compact-intro {
    margin-bottom: 15px;
  }

  .section-title {
    margin: 5px 0 0;
    font-size: clamp(34px, 4vw, 49px);
    line-height: 1.02;
    letter-spacing: -0.045em;
  }

  .smaller-title {
    font-size: 34px;
  }

  .count-badge {
    display: grid;
    place-items: center;
    min-width: 38px;
    height: 38px;
    border-radius: 50%;
    background: var(--plum);
    color: white;
    font-weight: 800;
  }

  .quiet-count {
    background: #ece4dc;
    color: var(--plum);
  }

  .match-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .match-card {
    position: relative;
    min-height: 330px;
    padding: 28px;
    border-radius: 28px;
    overflow: hidden;
    background:
      radial-gradient(circle at 88% 18%, rgba(215, 242, 58, 0.2), transparent 13rem),
      var(--muted-plum);
    color: white;
    box-shadow: 0 22px 55px rgba(74, 32, 68, 0.18);
  }

  .match-badge {
    display: inline-block;
    padding: 8px 12px;
    border-radius: 999px;
    background: var(--citron);
    color: #211b20;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .match-people {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 42px;
    color: rgba(255, 255, 255, 0.79);
    font-size: 12px;
    font-weight: 700;
  }

  .avatar {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #eadfda;
    color: var(--plum);
    font-size: 11px;
    font-weight: 800;
  }

  .avatar-you {
    background: #f2b8c5;
  }

  .avatar-peer {
    margin-left: -12px;
    border: 2px solid var(--muted-plum);
    background: #bfdce0;
  }

  .match-name {
    margin-top: 20px;
    font-size: clamp(36px, 4vw, 54px);
    line-height: 0.98;
    letter-spacing: -0.045em;
  }

  .match-action {
    width: 100%;
    margin-top: 28px;
  }

  .empty-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 24px;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: rgba(255, 253, 248, 0.78);
    color: var(--muted);
  }

  .empty-card strong {
    color: var(--ink);
    font-size: 13px;
  }

  .empty-card p {
    margin: 5px 0 0;
    font-size: 12px;
    line-height: 1.55;
  }

  .match-empty {
    align-items: center;
    padding: 28px;
  }

  .empty-symbol {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 15px;
    background: var(--lilac);
    color: var(--muted-plum);
    font-size: 18px;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
    gap: 18px;
    margin: 48px 0;
  }

  .paper-card {
    padding: 25px;
    border-radius: 24px;
  }

  .saved-list,
  .requests {
    display: grid;
  }

  .saved-row,
  .person-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 68px;
    padding: 13px 0;
    border-top: 1px solid #ece4dc;
  }

  .saved-row:first-child,
  .person-row:first-child {
    border-top: 0;
  }

  .item-name {
    font-size: 14px;
    font-weight: 750;
  }

  .saved-state {
    padding: 6px 10px;
    border-radius: 999px;
    background: #efe7dd;
    color: var(--muted-plum);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .connection-form {
    display: flex;
    gap: 8px;
    margin-bottom: 7px;
  }

  .connection-form input {
    flex: 1;
  }

  .mini-heading {
    margin: 18px 0 4px;
  }

  .person {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .person strong {
    font-size: 12px;
  }

  .meta {
    margin-top: 2px;
    color: #948a91;
    font-size: 10px;
  }

  .flat-empty {
    padding: 14px 0 4px;
    border: 0;
    background: transparent;
  }

  .reference-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 5px;
    color: var(--muted-plum);
    font-size: 10px;
    font-weight: 750;
    text-decoration: none;
  }

  .reference-link:hover {
    text-decoration: underline;
  }

  .light-link {
    color: rgba(255, 255, 255, 0.78);
  }

  .plan-composer {
    display: grid;
    grid-template-columns: minmax(0, 0.82fr) minmax(420px, 1fr);
    gap: 34px;
    align-items: stretch;
    padding: 34px;
    margin: 56px 0;
    border: 1px solid rgba(122, 53, 109, 0.2);
    border-radius: 30px;
    background:
      radial-gradient(circle at 100% 0%, rgba(215, 242, 58, 0.16), transparent 14rem),
      rgba(217, 205, 232, 0.38);
    scroll-margin: 110px;
    transition:
      box-shadow 180ms ease,
      transform 180ms ease;
  }

  .plan-composer-active {
    box-shadow: 0 22px 55px rgba(122, 53, 109, 0.14);
    transform: translateY(-2px);
  }

  .composer-heading {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 22px;
    align-content: start;
  }

  .composer-step {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--plum);
    color: white;
    font-size: 11px;
    font-weight: 800;
  }

  .composer-copy .section-title {
    margin-top: 7px;
    font-size: clamp(36px, 4.4vw, 56px);
    line-height: 0.98;
  }

  .composer-copy p {
    max-width: 560px;
    margin: 13px 0 0;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.6;
  }

  .composer-placeholder,
  .composer-panel {
    min-width: 0;
    border: 1px solid rgba(47, 29, 47, 0.08);
    border-radius: 22px;
    background: rgba(255, 253, 248, 0.86);
  }

  .composer-placeholder {
    display: grid;
    align-content: center;
    min-height: 190px;
    padding: 26px 28px;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.55;
  }

  .composer-placeholder strong {
    margin-top: 5px;
    color: var(--ink);
    font-family: Fraunces, Georgia, serif;
    font-size: 25px;
  }

  .composer-placeholder p {
    margin: 7px 0 0;
  }

  .placeholder-kicker {
    color: var(--muted-plum);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .composer-panel {
    padding: 22px;
  }

  .selected-activity {
    padding: 20px 21px;
    margin-bottom: 18px;
    border-radius: 18px;
    background: var(--plum);
    color: white;
  }

  .selected-topline {
    color: rgba(255, 255, 255, 0.72);
    font-size: 10px;
    font-weight: 700;
  }

  .selected-name {
    margin-top: 5px;
    color: white;
    font-size: clamp(29px, 3.3vw, 42px);
    line-height: 1.02;
    letter-spacing: -0.04em;
  }

  .selected-caption {
    margin-top: 9px;
    color: rgba(255, 255, 255, 0.68);
    font-size: 11px;
    line-height: 1.45;
  }

  .plan-time-field {
    display: grid;
    gap: 8px;
    margin: 0;
    color: var(--plum);
    font-size: 13px;
    font-weight: 800;
  }

  .plan-time-field small {
    color: var(--muted);
    font-size: 10px;
    font-weight: 500;
    line-height: 1.45;
  }

  .plan-time-input {
    min-height: 62px;
    padding: 15px 17px;
    border-width: 2px;
    border-color: rgba(122, 53, 109, 0.46);
    border-radius: 17px;
    background: #fffefa;
    font-size: 18px;
    font-weight: 750;
  }

  .plan-time-input::placeholder {
    color: #aa9eaa;
    font-weight: 650;
  }

  .composer-actions {
    margin-top: 18px;
  }

  .propose-button {
    min-height: 50px;
    padding-inline: 22px;
  }

  .plans-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .plan-card {
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 22px;
    background: rgba(255, 253, 248, 0.95);
    box-shadow: 0 12px 32px rgba(47, 29, 47, 0.045);
  }

  .plan-card > :not(.plan-footer) {
    margin-left: 22px;
    margin-right: 22px;
  }

  .plan-status-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 20px;
  }

  .status {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .status-proposed {
    background: #f1e5d5;
    color: #91601e;
  }

  .status-committed {
    background: var(--sage-soft);
    color: #50613b;
  }

  .status-completed {
    background: #ece8e4;
    color: #625b62;
  }

  .status-cancelled {
    background: var(--coral-soft);
    color: #8c432b;
  }

  .plan-owner {
    color: var(--muted);
    font-size: 9px;
  }

  .plan-name {
    margin-top: 22px;
    font-size: 34px;
    line-height: 1.02;
    letter-spacing: -0.04em;
  }

  .plan-time {
    margin-top: 18px;
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 800;
  }

  .plan-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 13px 20px;
    border-top: 1px solid var(--line);
    background: #faf6ef;
  }

  .committed-footer,
  .completed-footer {
    background: var(--sage-soft);
  }

  .cancelled-footer {
    background: #f8eee9;
  }

  .waiting-copy,
  .committed-copy,
  .finished-copy {
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
  }

  .committed-copy,
  .finished-copy {
    color: #50613b;
  }

  .muted {
    color: #8c6f64;
  }

  .plans-empty {
    max-width: 620px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
      transition: none !important;
    }
  }

  @media (max-width: 900px) {
    .hero,
    .auth-shell,
    .content-grid,
    .plan-composer {
      grid-template-columns: 1fr;
    }

    .hero,
    .auth-shell {
      gap: 30px;
    }

    .plan-composer {
      gap: 22px;
    }

    .composer-heading {
      grid-template-columns: 46px minmax(0, 1fr);
      gap: 16px;
    }

    .composer-step {
      width: 40px;
      height: 40px;
    }
  }

  @media (max-width: 700px) {
    .page {
      width: min(100% - 24px, 1180px);
      padding-top: 12px;
    }

    .topbar {
      top: 8px;
      margin-bottom: 38px;
    }

    .tagline {
      display: none;
    }

    .display-title {
      font-size: clamp(48px, 14vw, 68px);
    }

    .lede {
      font-size: 15px;
    }

    .summary-strip,
    .match-grid,
    .plans-list {
      grid-template-columns: 1fr;
    }

    .summary-strip {
      gap: 0;
    }

    .summary-item {
      border-bottom: 1px solid var(--line);
    }

    .summary-item:last-child {
      border-bottom: 0;
    }

    .match-card {
      min-height: 300px;
    }

    .section-title {
      font-size: 38px;
    }

    .plan-composer {
      padding: 24px;
    }

    .composer-panel {
      padding: 18px;
    }

    .plan-time-input {
      min-height: 58px;
      font-size: 17px;
    }
  }

  @media (max-width: 520px) {
    .composer-heading {
      grid-template-columns: 1fr;
    }

    .composer-step {
      width: 38px;
      height: 38px;
    }

    .composer-copy .section-title {
      font-size: 38px;
    }

    .composer-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .composer-actions .button {
      width: 100%;
    }

    .brand-copy {
      display: none;
    }

    .username-pill {
      max-width: 130px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .auth-actions,
    .connection-form,
    .plan-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .auth-actions .button,
    .connection-form .button,
    .plan-footer .button,
    .composer-actions .button {
      width: 100%;
    }

    .composer-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .match-card,
    .paper-card,
    .capture-card,
    .auth-card {
      border-radius: 22px;
    }
  }
`;

document.head.appendChild(style);

/* Group planning: multiple independently interested friends, one proposal. */
