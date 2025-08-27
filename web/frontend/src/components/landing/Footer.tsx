export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} HR Avatar · FastAPI · React · ASR · MLOps
        </p>
      </div>
    </footer>
  )
}
