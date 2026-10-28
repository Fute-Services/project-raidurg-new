import AppRoutes from './Routes/Routes'
import IosInstallHint from './Components/IosInstallHint'
import InstallPrompt from './Components/InstallPrompt'

const App = () => {
  return (
    <>
      <AppRoutes />
      {/* Install affordances are always available — the client has to be able to
          put the app on their home screen, and the browser only offers that
          while the site is open in a normal tab. Signing in is still required to
          see any content, and the heavy video download is still session-gated
          (see src/main.tsx). InstallPrompt covers Android/desktop Chrome,
          IosInstallHint covers Safari, which has no install API. */}
      <InstallPrompt />
      <IosInstallHint />
    </>
  )
}

export default App
