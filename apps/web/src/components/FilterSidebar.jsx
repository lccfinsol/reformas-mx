
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const FilterSidebar = ({ filters, onFilterChange, onClearFilters }) => {
  const filterSections = [
    {
      title: 'Nivel',
      key: 'nivel',
      options: ['Federal', 'Estatal', 'Municipal']
    },
    {
      title: 'Fuente',
      key: 'fuente',
      options: ['Diario Oficial de la Federación', 'Cámara de Diputados', 'Periódicos Oficiales de Estados', 'Otros']
    },
    {
      title: 'Materia legal',
      key: 'materia_legal',
      options: ['Fiscal', 'Laboral', 'Mercantil', 'Administrativo', 'Penal', 'Civil', 'Otro']
    }
  ];

  const handleCheckboxChange = (filterKey, value) => {
    const currentValues = filters[filterKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange(filterKey, newValues);
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr && arr.length > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {filterSections.map((section, idx) => (
          <div key={section.key}>
            {idx > 0 && <Separator className="mb-4" />}
            <h3 className="font-semibold mb-3 text-sm">{section.title}</h3>
            <div className="space-y-3">
              {section.options.map(option => {
                const isChecked = (filters[section.key] || []).includes(option);
                return (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${section.key}-${option}`}
                      checked={isChecked}
                      onCheckedChange={() => handleCheckboxChange(section.key, option)}
                    />
                    <Label
                      htmlFor={`${section.key}-${option}`}
                      className="text-sm font-normal cursor-pointer leading-tight"
                    >
                      {option}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default FilterSidebar;
