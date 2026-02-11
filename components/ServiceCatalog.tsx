import React, { useState, useMemo } from 'react';
import { CatalogItem, ServiceType } from '../types';
import { formatCurrency } from '../utils';
import { Sparkles, ArrowRight, Star, Search, Share2, X, Check } from 'lucide-react';

interface ServiceCatalogProps {
  onSelectService: (service: ServiceType) => void;
  catalog: Record<ServiceType, CatalogItem>;
}

const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ onSelectService, catalog }) => {
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sharedId, setSharedId] = useState<string | null>(null);

  const handleImageError = (id: string, e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=800"; 
  };

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => ({ ...prev, [id]: true }));
  };

  const filteredServices = useMemo(() => {
    const services = Object.values(catalog) as CatalogItem[];
    if (!searchTerm.trim()) return services;
    
    const term = searchTerm.toLowerCase();
    return services.filter(s => 
      s.title.toLowerCase().includes(term) || 
      s.description.toLowerCase().includes(term)
    );
  }, [catalog, searchTerm]);

  const handleShare = async (e: React.MouseEvent, item: CatalogItem) => {
    e.stopPropagation();
    const shareData = {
      title: `Nails by Diva - ${item.title}`,
      text: `${item.title}: ${item.description}\n¡Reserva tu turno de lujo ahora!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error al compartir:", err);
      }
    } else {
      // Fallback: Copiar al portapapeles
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        setSharedId(item.id);
        setTimeout(() => setSharedId(null), 2000);
      } catch (err) {
        console.error("Error al copiar enlace:", err);
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 mb-20">
      {/* Section Header */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-center gap-3 mb-4 opacity-70">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brand-900"></div>
            <span className="text-brand-900 text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase">Estilo y Elegancia</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brand-900"></div>
        </div>
        
        <h3 className="font-serif text-4xl md:text-6xl text-brand-900 mb-6 drop-shadow-sm">
          Nuestra Carta de Servicios
        </h3>
        
        <p className="text-brand-800 font-sans text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-10">
          Encuentra el tratamiento ideal para resaltar tu personalidad. Desde cuidados clásicos hasta las últimas tendencias en arte de uñas.
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-brand-300 group-focus-within:text-gold-500 transition-colors" />
          </div>
          <input 
            type="text"
            placeholder="Buscar por servicio (Ej: Esculpidas, Spa...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-brand-200 rounded-2xl pl-12 pr-10 py-4 focus:outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-500/10 transition-all text-sm font-sans shadow-md"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-300 hover:text-brand-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-brand-200">
           <p className="text-brand-400 font-sans italic text-lg">No encontramos servicios que coincidan con tu búsqueda. Intenta con otra palabra clave.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {filteredServices.map((item, index) => (
            <div 
              key={item.id}
              className="group relative flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-brand-200 shadow-lg hover:shadow-2xl hover:border-gold-500/40 transition-all duration-500 hover:-translate-y-3 cursor-pointer active:scale-95 active:bg-brand-50"
              onClick={() => onSelectService(item.id)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image Section */}
              <div className="relative h-80 overflow-hidden bg-brand-100">
                
                {/* Skeleton/Shimmer */}
                {!loadedImages[item.id] && (
                  <div className="absolute inset-0 shimmer z-10" />
                )}

                <img 
                  src={item.image} 
                  alt={item.title}
                  loading="lazy"
                  onLoad={() => handleImageLoad(item.id)}
                  onError={(e) => handleImageError(item.id, e)}
                  className={`w-full h-full object-cover transform group-hover:scale-125 transition-all duration-1000 ease-out ${loadedImages[item.id] ? 'opacity-100' : 'opacity-0'}`}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-50 transition-opacity"></div>
                
                {/* Share Button */}
                <button 
                  onClick={(e) => handleShare(e, item)}
                  className="absolute top-5 right-5 z-30 p-2.5 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white hover:text-brand-900 transition-all shadow-xl border border-white/20"
                  aria-label="Compartir servicio"
                >
                  {sharedId === item.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>

                {/* Badge for Featured/Course */}
                {item.id.includes('Curso') && (
                  <div className="absolute top-5 left-5 z-20">
                     <div className="bg-gold-500/90 backdrop-blur-md border border-gold-400 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                        <Star className="w-3.5 h-3.5 text-white fill-white" />
                        <span className="text-[10px] text-white font-black tracking-widest uppercase">Especial</span>
                     </div>
                  </div>
                )}

                {/* Price Display */}
                <div className="absolute bottom-5 right-5 z-20">
                   <div className="bg-white/95 backdrop-blur-md text-brand-900 px-5 py-2.5 rounded-xl font-mono font-bold text-xl shadow-xl border border-brand-100 group-hover:bg-gold-500 group-hover:text-white group-hover:border-gold-400 transition-all duration-700">
                      {formatCurrency(item.price)}
                   </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="relative z-20 flex-1 flex flex-col p-8 bg-white group-active:bg-brand-50 transition-colors duration-300">
                
                <div className="flex-1 flex flex-col">
                    <h4 className="font-serif text-3xl text-brand-900 mb-3 group-hover:text-gold-600 transition-colors">
                      {item.title}
                    </h4>
                    <div className="w-12 h-0.5 bg-brand-200 mb-5 group-hover:w-full group-hover:bg-gold-500 transition-all duration-700"></div>
                    
                    <p className="text-brand-800 text-sm font-sans leading-relaxed mb-8 line-clamp-3 opacity-90">
                      {item.description}
                    </p>
                    
                    <div className="mt-auto pt-5 border-t border-brand-50">
                      <div className="w-full flex items-center justify-between text-xs font-black uppercase tracking-[0.25em] text-brand-500 group-hover:text-gold-600 transition-all group-hover:translate-x-1">
                          <span>Reservar Ahora</span>
                          <div className="bg-brand-50 group-hover:bg-gold-500 group-hover:text-white p-2 rounded-full transition-all shadow-sm">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceCatalog;