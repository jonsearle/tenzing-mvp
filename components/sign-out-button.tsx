export function SignOutButton() {
  return (
    <form action="/auth/sign-out" method="post">
      <button className="buttonSecondary" type="submit">
        Sign out
      </button>
    </form>
  );
}

