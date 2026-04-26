import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { ApiTokensPage } from './pages/ApiTokensPage'
import { ArtifactsPage } from './pages/ArtifactsPage'
import { ExpositionDetailPage } from './pages/ExpositionDetailPage'
import { ExpositionsPage } from './pages/ExpositionsPage'
import { GatewayGroupsPage } from './pages/GatewayGroupsPage'
import { LoginPage } from './pages/LoginPage'
import { PlanDetailPage } from './pages/PlanDetailPage'
import { PlanNewPage } from './pages/PlanNewPage'
import { PlansPage } from './pages/PlansPage'
import { QuotasPage } from './pages/QuotasPage'
import { SecretsPage } from './pages/SecretsPage'
import { ServiceDetailPage } from './pages/ServiceDetailPage'
import { ServicesPage } from './pages/ServicesPage'
import { McpCustomToolsPage } from './pages/McpCustomToolsPage'
import { McpPromptsPage } from './pages/McpPromptsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/services" replace />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/artifacts" element={<ArtifactsPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/plans/new" element={<PlanNewPage />} />
          <Route path="/plans/:id" element={<PlanDetailPage />} />
          <Route path="/expositions" element={<ExpositionsPage />} />
          <Route path="/expositions/:id" element={<ExpositionDetailPage />} />
          <Route path="/mcp-custom-tools" element={<McpCustomToolsPage />} />
          <Route path="/mcp-prompts" element={<McpPromptsPage />} />
          <Route path="/secrets" element={<SecretsPage />} />
          <Route path="/gateway-groups" element={<GatewayGroupsPage />} />
          <Route path="/quotas" element={<QuotasPage />} />
          <Route path="/api-tokens" element={<ApiTokensPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/services" replace />} />
    </Routes>
  )
}
