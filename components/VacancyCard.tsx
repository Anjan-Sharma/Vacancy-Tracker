import React from 'react';
import { Vacancy } from '../types';
import { Calendar, Clock, Building2, MapPin, Users, GraduationCap, Layers, UserCheck, Tag, AlertTriangle } from 'lucide-react';

interface VacancyCardProps {
  vacancy: Vacancy;
}

const VacancyCard: React.FC<VacancyCardProps> = ({ vacancy }) => {
  
  const getCategoryColor = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes('technical') && !lower.includes('non')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (lower.includes('non-technical')) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (lower.includes('internship')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (lower.includes('government') || lower.includes('lok')) return 'bg-red-100 text-red-700 border-red-200';
    if (lower.includes('bank')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Helper to check if deadline is urgent
  const isUrgent = (vacancy.daysRemaining?.toLowerCase().includes('1 day') || 
                   vacancy.daysRemaining?.toLowerCase().includes('2 days') || 
                   vacancy.daysRemaining?.toLowerCase().includes('today'));

  // Ensure category is an array
  const categories = Array.isArray(vacancy.category) && vacancy.category.length > 0 
    ? vacancy.category 
    : ['General'];

  // Check if title has (करार सेवा)
  const isContract = vacancy.title.includes('(करार सेवा)');
  const displayTitle = isContract 
    ? vacancy.title.replace('(करार सेवा)', '').trim() 
    : vacancy.title;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-green-600 p-5 mb-4 group relative overflow-hidden">
      
      {/* Header Row: Categories */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-wrap gap-1.5 max-w-full">
          {categories.map((cat, idx) => (
            <div key={idx} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-flex items-center gap-1 ${getCategoryColor(cat)}`}>
              <Tag className="w-3 h-3" />
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1 group-hover:text-green-700 transition-colors flex flex-wrap items-center gap-2">
          {displayTitle}
          {isContract && (
            <span className="inline-flex items-center text-sm text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200 font-bold whitespace-nowrap">
               (करार सेवा)
            </span>
          )}
        </h3>
        <div className="flex items-center text-green-700 font-medium">
          <Building2 className="w-4 h-4 mr-1" />
          <span>{vacancy.organization}</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 bg-green-50/50 p-3 rounded-md border border-green-100">
        <div className="flex items-start gap-2">
          <Layers className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-green-800 uppercase tracking-wide">तह (Level)</span>
            <span className="text-sm text-gray-700 font-medium break-words">{vacancy.level || 'खुलेको छैन'}</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <GraduationCap className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-green-800 uppercase tracking-wide">योग्यता (Education)</span>
            <span className="text-sm text-gray-700 font-medium break-words">{vacancy.qualification || 'खुलेको छैन'}</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <UserCheck className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <span className="block text-[10px] font-bold text-green-800 uppercase tracking-wide">उमेर (Eligibility)</span>
            <span className="text-sm text-gray-700 font-medium break-words">{vacancy.eligibility || 'खुलेको छैन'}</span>
          </div>
        </div>
      </div>

      {/* Deadline Section - Highlighted */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
         <div className={`flex-1 flex items-center justify-between px-3 py-2 rounded border ${isUrgent ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
            <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase opacity-80">अन्तिम म्याद (Single Pay)</span>
                    <span className="font-semibold text-sm">{vacancy.deadline}</span>
                </div>
            </div>
            {vacancy.daysRemaining && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isUrgent ? 'bg-red-200 text-red-900' : 'bg-yellow-200 text-yellow-900'}`}>
                    {vacancy.daysRemaining}
                </span>
            )}
         </div>

         {vacancy.deadlineDouble && (
             <div className="flex-1 flex items-center px-3 py-2 rounded border bg-orange-50 border-orange-200 text-orange-800">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase opacity-80">दोब्बर दस्तुर (Double Pay)</span>
                    <span className="font-semibold text-sm">{vacancy.deadlineDouble}</span>
                </div>
             </div>
         )}
      </div>

      {/* Location & Seats */}
      <div className="flex gap-3 mb-4 text-xs text-gray-500">
        {vacancy.location && (
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            <span>{vacancy.location}</span>
          </div>
        )}
        {vacancy.vacancyNumber && (
          <div className="flex items-center">
            <Users className="w-3.5 h-3.5 mr-1" />
            <span>{vacancy.vacancyNumber} Seats</span>
          </div>
        )}
      </div>

      <p className="text-gray-700 mb-4 text-sm leading-relaxed border-t border-gray-100 pt-3">
        {vacancy.description}
      </p>

      <div className="flex items-center text-xs text-gray-400">
        <Calendar className="w-3.5 h-3.5 mr-1" />
        <span>प्रकाशित मिति: {vacancy.publishedDate}</span>
      </div>
    </div>
  );
};

export default VacancyCard;