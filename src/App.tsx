import AppRoutes from './Routes/Routes'
import IosInstallHint from './Components/IosInstallHint'

const App = () => {
  return (
    <>
      <AppRoutes />
      {/* Safari has no install API, so this hint is the only way to point iOS users at Add to Home Screen. */}
      <IosInstallHint />
    </>
  )
}

export default App
