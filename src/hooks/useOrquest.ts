import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrquestService, OrquestSyncResponse } from '@/types/orquest';
import { useToast } from '@/hooks/use-toast';

interface OrquestEmployee {
  id: string;
  service_id: string;
  nombre: string | null;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  puesto: string | null;
  departamento: string | null;
  fecha_alta: string | null;
  fecha_baja: string | null;
  estado: string | null;
  datos_completos: any;
  updated_at: string | null;
}

export const useOrquest = (franchiseeId?: string) => {
  const [services, setServices] = useState<OrquestService[]>([]);
  const [employees, setEmployees] = useState<OrquestEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('servicios_orquest')
        .select('*');
      
      // Filtrar por franchisee_id si se proporciona
      if (franchiseeId) {
        query = query.eq('franchisee_id', franchiseeId);
      }
      
      const { data, error: fetchError } = await query.order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setServices(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar servicios de Orquest';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('orquest_employees')
        .select('*');
      
      // Filtrar por franchisee_id si se proporciona
      if (franchiseeId) {
        query = query.eq('franchisee_id', franchiseeId);
      }
      
      const { data, error: fetchError } = await query.order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setEmployees(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar empleados de Orquest';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncWithOrquest = async (): Promise<OrquestSyncResponse | null> => {
    try {
      setLoading(true);
      
      if (!franchiseeId) {
        throw new Error('franchiseeId is required for sync operations');
      }
      
      // Validate franchiseeId format
      if (!franchiseeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw new Error('Invalid franchiseeId format. Expected UUID format.');
      }
      
      console.log('Syncing Orquest data for franchiseeId:', franchiseeId);
      
      const { data, error: syncError } = await supabase.functions.invoke('orquest-sync', {
        body: { action: 'sync_all', franchiseeId }
      });

      if (syncError) {
        console.error('Orquest sync error:', syncError);
        throw syncError;
      }

      await Promise.all([fetchServices(), fetchEmployees()]); // Refresh data
      
      const successMessage = data.employees_updated 
        ? `${data.services_updated} servicios y ${data.employees_updated} empleados actualizados`
        : `${data.services_updated} servicios actualizados`;
      
      toast({
        title: "Sincronización exitosa",
        description: successMessage,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en la sincronización';
      console.error('Orquest sync error:', err);
      setError(errorMessage);
      toast({
        title: "Error de sincronización",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const syncEmployeesOnly = async (): Promise<OrquestSyncResponse | null> => {
    try {
      setLoading(true);
      
      if (!franchiseeId) {
        throw new Error('franchiseeId is required for sync operations');
      }
      
      // Validate franchiseeId format
      if (!franchiseeId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw new Error('Invalid franchiseeId format. Expected UUID format.');
      }
      
      console.log('Syncing Orquest employees for franchiseeId:', franchiseeId);
      
      const { data, error: syncError } = await supabase.functions.invoke('orquest-sync', {
        body: { action: 'sync_employees', franchiseeId }
      });

      if (syncError) {
        console.error('Orquest employees sync error:', syncError);
        throw syncError;
      }

      await fetchEmployees(); // Refresh employees data
      
      toast({
        title: "Sincronización de empleados exitosa",
        description: `${data.employees_updated || 0} empleados actualizados`,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en la sincronización de empleados';
      console.error('Orquest employees sync error:', err);
      setError(errorMessage);
      toast({
        title: "Error de sincronización",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateService = async (serviceId: string, updates: Partial<OrquestService>) => {
    try {
      const { error: updateError } = await supabase
        .from('servicios_orquest')
        .update(updates)
        .eq('id', serviceId);

      if (updateError) throw updateError;

      await fetchServices(); // Refresh data
      
      toast({
        title: "Servicio actualizado",
        description: "El servicio se ha actualizado correctamente",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar servicio';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (franchiseeId) {
      fetchServices();
      fetchEmployees();
    }
  }, [franchiseeId]);

  return {
    services,
    employees,
    loading,
    error,
    fetchServices,
    fetchEmployees,
    syncWithOrquest,
    syncEmployeesOnly,
    updateService,
    refetch: () => {
      fetchServices();
      fetchEmployees();
    }
  };
};