
import React from 'react';
import { useUnifiedAuth } from '@/hooks/auth/useUnifiedAuth';
import { useNavigate } from 'react-router-dom';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, BarChart3, Building, TrendingUp, Zap, Database, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

type DisplayRestaurant = {
  id: string;
  name?: string;
  restaurant_name?: string;
  location?: string;
  city?: string;
  address?: string;
  siteNumber?: string;
  site_number?: string;
  franchiseeName?: string;
  opening_date?: string;
  contractEndDate?: string;
  restaurant_type?: string;
  status?: string;
  lastYearRevenue?: number;
  baseRent?: number;
  isOwnedByMcD?: boolean;
  currentValuation?: any;
};

const OptimizedDashboardPage = () => {
  const { 
    user, 
    franchisee, 
    restaurants, 
    loading, 
    connectionStatus,
    isImpersonating,
    effectiveFranchisee,
    getDebugInfo
  } = useUnifiedAuth();
  const navigate = useNavigate();

  // Debug completo del estado
  const debugInfo = getDebugInfo();
  console.log('OptimizedDashboardPage - Estado completo:', debugInfo);
  console.log('OptimizedDashboardPage - Datos específicos:', {
    user: user ? { id: user.id, role: user.role, email: user.email } : null,
    franchisee: franchisee ? { id: franchisee.id, name: franchisee.franchisee_name } : null,
    effectiveFranchisee: effectiveFranchisee ? { id: effectiveFranchisee.id, name: effectiveFranchisee.franchisee_name } : null,
    restaurantsCount: restaurants?.length || 0,
    loading,
    connectionStatus,
    isImpersonating
  });

  // Transformar datos para el componente
  const displayRestaurants: DisplayRestaurant[] = restaurants.map(r => ({
    id: r.id || `restaurant-${Math.random()}`,
    name: r.base_restaurant?.restaurant_name || 'Restaurante',
    restaurant_name: r.base_restaurant?.restaurant_name || 'Restaurante',
    location: r.base_restaurant ? 
      `${r.base_restaurant.city || 'Ciudad'}, ${r.base_restaurant.address || 'Dirección'}` : 
      'Ubicación',
    city: r.base_restaurant?.city || 'Ciudad',
    address: r.base_restaurant?.address || 'Dirección',
    siteNumber: r.base_restaurant?.site_number || 'N/A',
    site_number: r.base_restaurant?.site_number || 'N/A',
    franchiseeName: effectiveFranchisee?.franchisee_name || 'Franquiciado',
    franchise_start_date: r.franchise_start_date,
    franchise_end_date: r.franchise_end_date,
    restaurant_type: r.base_restaurant?.restaurant_type || 'traditional',
    status: r.status || 'active',
    lastYearRevenue: typeof r.last_year_revenue === 'number' ? r.last_year_revenue : 0,
    baseRent: typeof r.monthly_rent === 'number' ? r.monthly_rent : 0,
    isOwnedByMcD: false,
  }));

  // Calcular métricas del dashboard
  const calculateDashboardMetrics = () => {
    const totalRevenue = displayRestaurants.reduce((sum, r) => sum + (r.lastYearRevenue || 0), 0);
    const totalRent = displayRestaurants.reduce((sum, r) => sum + (r.baseRent || 0) * 12, 0);
    const operatingMargin = totalRevenue > 0 ? ((totalRevenue - totalRent) / totalRevenue) * 100 : 0;
    const averageROI = totalRevenue > 0 && totalRent > 0 ? ((totalRevenue - totalRent) / totalRent) * 100 : 0;

    return {
      totalRevenue,
      operatingMargin,
      averageROI,
      totalRestaurants: displayRestaurants.length
    };
  };

  const metrics = calculateDashboardMetrics();

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'reconnecting':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: 'Reconectando...',
          color: 'text-blue-600',
          bg: 'bg-blue-100'
        };
      case 'online':
        return {
          icon: <Database className="w-4 h-4" />,
          text: 'En Línea',
          color: 'text-green-600',
          bg: 'bg-green-100'
        };
      case 'offline':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Sin Conexión',
          color: 'text-red-600',
          bg: 'bg-red-100'
        };
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Estado Desconocido',
          color: 'text-gray-600',
          bg: 'bg-gray-100'
        };
    }
  };

  const statusDisplay = getConnectionStatusDisplay();

  // Loading solo durante la carga inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de Supabase...</p>
          <p className="text-sm text-gray-500 mt-2">Estado: {connectionStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <ImpersonationBanner />
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900">Dashboard - Datos Reales</h1>
                <div className={`flex items-center gap-2 px-3 py-1 ${statusDisplay.bg} ${statusDisplay.color} rounded-md text-sm font-medium`}>
                  {statusDisplay.icon}
                  <span>{statusDisplay.text}</span>
                </div>
                {connectionStatus === 'online' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                    <Zap className="w-3 h-3" />
                    <span>Sistema Unificado</span>
                  </div>
                )}
                {isImpersonating && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    <Users className="w-3 h-3" />
                    <span>Impersonando</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {connectionStatus === 'online' 
                  ? `Sistema unificado activo - Usuario: ${user?.email}` 
                  : connectionStatus === 'offline'
                    ? 'Sin conexión con la base de datos'
                    : 'Reconectando con la base de datos...'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/analysis')} 
                variant="default" 
                size="sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Análisis
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="space-y-6">
              {/* Estado de la cuenta y franquiciado */}
              {user && franchisee && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          {franchisee.franchisee_name}
                        </h3>
                        <p className="text-sm text-blue-700">
                          Usuario: {user.full_name} ({user.email}) • Rol: {user.role}
                        </p>
                        <p className="text-xs text-blue-600">
                          ID Franquiciado: {franchisee.id} • Restaurantes: {restaurants.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alerta si no hay franquiciado pero sí usuario */}
              {user && !franchisee && connectionStatus === 'online' && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Tu usuario ({user.email}) existe pero no tiene un franquiciado asignado. 
                    Contacta con tu asesor para que te asigne un franquiciado.
                  </AlertDescription>
                </Alert>
              )}

              {/* Alerta de estado de conexión */}
              {connectionStatus === 'offline' && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Sin conexión con la base de datos. Algunos datos pueden no estar actualizados.
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="link" 
                      className="p-0 h-auto ml-2 text-red-800 underline"
                    >
                      Intentar reconectar
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Debug info para desarrollo */}
              {restaurants.length === 0 && user && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    No se encontraron restaurantes. Estado actual:
                    <br />• Usuario: {user.email} (ID: {user.id})
                    <br />• Franquiciado: {franchisee ? `${franchisee.franchisee_name} (ID: ${franchisee.id})` : 'No encontrado'}
                    <br />• Conexión: {connectionStatus}
                    <br />• Restaurantes: {restaurants.length}
                  </AlertDescription>
                </Alert>
              )}

              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Restaurantes</CardTitle>
                    <Building className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalRestaurants}</div>
                    <p className="text-xs text-muted-foreground">
                      {connectionStatus === 'online' ? 'En línea' : 'Sin conexión'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">Último año</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Margen Operativo</CardTitle>
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.operatingMargin.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Estimado</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ROI Promedio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.averageROI.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Retorno anual</p>
                  </CardContent>
                </Card>
              </div>

              {/* Dashboard principal */}
              <DashboardSummary 
                totalRestaurants={metrics.totalRestaurants} 
                displayRestaurants={displayRestaurants}
                isTemporaryData={connectionStatus === 'offline'}
              />
            </div>
          </main>
        </SidebarInset>
        
        {/* Panel de debugging */}
        <AuthDebugPanel />
      </div>
    </SidebarProvider>
  );
};

export default OptimizedDashboardPage;
