import React, { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Review } from '../types';
import { generateId } from '../utils';

interface ReviewSectionProps {
  reviews: Review[];
  onAddReview: (review: Review) => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ reviews, onAddReview }) => {
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 5 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment) return;

    onAddReview({
      id: generateId(),
      clientName: newReview.name,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split('T')[0]
    });
    setNewReview({ name: '', comment: '', rating: 5 });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h3 className="font-serif text-3xl text-brand-900 mb-3 flex items-center justify-center gap-3">
          <Star className="w-6 h-6 fill-gold-500 text-gold-500" />
          EXPERIENCIAS DIVA
          <Star className="w-6 h-6 fill-gold-500 text-gold-500" />
        </h3>
        <p className="text-brand-800 font-sans text-sm tracking-widest uppercase">Lo que dicen nuestras clientas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Reviews List */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {reviews.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl border border-brand-200 text-brand-400">
              <p>Sé la primera en dejarnos tu opinión ✨</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-white p-4 rounded-xl border border-brand-200 hover:border-gold-500/50 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-brand-900 font-serif">{review.clientName}</h4>
                  <div className="flex text-gold-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-gold-500' : 'text-brand-100'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-brand-800 text-sm font-sans mb-2">"{review.comment}"</p>
                <p className="text-xs text-brand-400 text-right">{review.date}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Review Form */}
        <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-sm h-fit">
          <h4 className="text-lg text-brand-900 font-serif mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gold-500" />
            Deja tu reseña
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Tu Nombre"
                required
                className="w-full bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm focus:border-brand-900 outline-none text-brand-900"
                value={newReview.name}
                onChange={e => setNewReview({...newReview, name: e.target.value})}
              />
            </div>
            <div>
               <label className="block text-xs text-brand-500 mb-1">Calificación</label>
               <div className="flex gap-2">
                 {[1, 2, 3, 4, 5].map(star => (
                   <button
                     key={star}
                     type="button"
                     onClick={() => setNewReview({...newReview, rating: star})}
                     className="focus:outline-none"
                   >
                     <Star 
                        className={`w-6 h-6 transition-all hover:scale-110 ${star <= newReview.rating ? 'text-gold-500 fill-gold-500' : 'text-brand-200'}`} 
                     />
                   </button>
                 ))}
               </div>
            </div>
            <div>
              <textarea
                placeholder="Cuéntanos tu experiencia..."
                required
                rows={3}
                className="w-full bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm focus:border-brand-900 outline-none text-brand-900 resize-none"
                value={newReview.comment}
                onChange={e => setNewReview({...newReview, comment: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-brand-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors text-sm uppercase tracking-wide"
            >
              Publicar Reseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;