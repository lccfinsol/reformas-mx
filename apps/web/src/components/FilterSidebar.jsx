
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FilterSidebar = ({ initialFilters = {}, onApply, onClear }) => {
  const [draft, setDraft] = useState({
    keyword: '',
    nivel: 'Todos',
    materia: 'Todas',
    dateRange: 'all',
    customStart: '',
    customEnd: '',
    ...initialFilters
  });

  // Sync with prop updates if they change externally
  useEffect(() => {
    setDraft(prev => ({ ...prev, ...initialFilters }));
  }, [initialFilters]);

  const handleChange = (key, value) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(draft);
  };

  const handleClear = () => {
    const cleared = {
      keyword: '',
      nivel: 'Todos',
      materia: 'Todas',
      dateRange: 'all',
      customStart: '',
      customEnd: ''
    };
    setDraft(cleared);
    onClear(cleared);
  };

  const niveles = ['Todos', 'Federal', 'Estatal', 'Municipal'];
  const materias = ['Todas', 'Fiscal', 'Laboral', 'Mercantil', 'Administrativo', 'Penal', 'Civil', 'Ambiental', 'Otro'];

  return (
    <div className="filter-box">
      <div>
        <h3 className="text-xl font-bold font-serif text-foreground">Filtros de Búsqueda</h3>
        <p className="text-sm text-muted-foreground mt-1">Refina los resultados de tu consulta</p>
      </div>
      
      <div className="space-y-6">
        {/* Keyword Search */}
        <div>
          <label className="filter-label">Palabra Clave</label>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Buscar título o contenido..." 
              value={draft.keyword} 
              onChange={e => handleChange('keyword', e.target.value)}
              className="filter-input-styled pl-10"
            />
          </div>
        </div>

        {/* Nivel de Gobierno */}
        <div>
          <label className="filter-label">Nivel de Gobierno</label>
          <RadioGroup 
            value={draft.nivel} 
            onValueChange={(val) => handleChange('nivel', val)}
            className="flex flex-col gap-3"
          >
            {niveles.map(nivel => (
              <div key={nivel} className="flex items-center space-x-3">
                <RadioGroupItem value={nivel} id={`nivel-${nivel}`} />
                <Label htmlFor={`nivel-${nivel}`} className="cursor-pointer font-medium text-foreground">{nivel}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Materia Legal */}
        <div>
          <label className="filter-label">Materia Legal</label>
          <div className="max-h-56 overflow-y-auto pr-2 pb-2">
            <RadioGroup 
              value={draft.materia} 
              onValueChange={(val) => handleChange('materia', val)}
              className="flex flex-col gap-3"
            >
              {materias.map(materia => (
                <div key={materia} className="flex items-center space-x-3">
                  <RadioGroupItem value={materia} id={`materia-${materia}`} />
                  <Label htmlFor={`materia-${materia}`} className="cursor-pointer font-medium text-foreground">{materia}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Rango de Fechas */}
        <div>
          <label className="filter-label">Fecha de Publicación</label>
          <Select value={draft.dateRange} onValueChange={(val) => handleChange('dateRange', val)}>
            <SelectTrigger className="w-full border-2 border-border rounded-lg h-12 bg-background focus:ring-0 focus:border-primary">
              <SelectValue placeholder="Seleccione un rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="custom">Rango Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {draft.dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <span className="text-xs text-muted-foreground font-medium mb-1.5 block">Desde</span>
                <input 
                  type="date" 
                  value={draft.customStart} 
                  onChange={e => handleChange('customStart', e.target.value)}
                  className="filter-input-styled text-sm py-2 px-3"
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground font-medium mb-1.5 block">Hasta</span>
                <input 
                  type="date" 
                  value={draft.customEnd} 
                  onChange={e => handleChange('customEnd', e.target.value)}
                  className="filter-input-styled text-sm py-2 px-3"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 space-y-3 mt-2">
        <button onClick={handleApply} className="filter-button-primary">
          Aplicar Filtros
        </button>
        <button onClick={handleClear} className="filter-button-secondary">
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;
