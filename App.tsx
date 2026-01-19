import React, { useState, useEffect } from 'react';
import { Search, Bell, AlertCircle, FileText, ChevronDown, Clover, Radar, Filter } from 'lucide-react';
import { fetchVacancies } from './services/geminiService';
import { LoadingState, SearchResult, Vacancy } from './types';
import VacancyCard from './components/VacancyCard';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Filtering State
  const [activeFilter, setActiveFilter] = useState<string>('All');

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (count: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Vacancy Alert!', {
        body: `Found ${count} active vacancies.`,
        icon: 'https://cdn-icons-png.flaticon.com/512/3252/3252817.png'
      });
    }
  };

  const handleFetch = async (isLoadMore: boolean = false) => {
    setLoadingState(LoadingState.SEARCHING);
    setError(null);

    const existingTitles = isLoadMore ? vacancies.map(v => v.title) : [];

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), 120000)
      );
      
      const result = await Promise.race([fetchVacancies(existingTitles), timeoutPromise]) as SearchResult;
      
      if (isLoadMore) {
        setVacancies(prev => [...prev, ...result.vacancies]);
        setSources(prev => [...prev, ...result.sources]); 
      } else {
        setVacancies(result.vacancies);
        setSummary(result.rawSummary);
        setSources(result.sources);
      }

      setLastUpdated(new Date().toLocaleTimeString());
      setLoadingState(LoadingState.COMPLETED);

      if (result.vacancies.length > 0 && !isLoadMore) {
        sendNotification(result.vacancies.length);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch vacancies. The AI service might be busy.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleInitialSearch = () => {
    setVacancies([]);
    setActiveFilter('All'); // Reset filter on new search
    handleFetch(false);
  };

  const handleLoadMore = () => {
    handleFetch(true);
  };

  // Smart Filtering Logic
  const categories = ['All', 'Technical', 'Non-Technical', 'Government', 'Banking', 'Internship'];

  const filteredVacancies = vacancies.filter(vacancy => {
    if (activeFilter === 'All') return true;
    const vacancyCats = vacancy.category || [];
    // Case-insensitive exact match for better accuracy
    return vacancyCats.some(cat => cat.toLowerCase() === activeFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-green-50 text-gray-800 font-sans pb-10">
      <nav className="bg-green-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clover className="w-6 h-6 text-yellow-300" />
            <h1 className="text-xl font-bold tracking-tight">LokSewa Smart Tracker</h1>
          </div>
          <button 
            onClick={() => Notification.requestPermission()}
            className="p-2 hover:bg-green-800 rounded-full transition-colors"
            title="Enable Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Main Search Area */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6 mb-6 text-center overflow-hidden relative">
          
          {loadingState === LoadingState.SEARCHING ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              {/* Radar Animation */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                 <div className="absolute w-full h-full border-4 border-green-100 rounded-full animate-ping opacity-75"></div>
                 <div className="absolute w-16 h-16 border-4 border-green-300 rounded-full animate-ping delay-150"></div>
                 <div className="relative bg-green-600 rounded-full p-4 shadow-xl z-10 animate-pulse">
                    <Radar className="w-8 h-8 text-white animate-spin-slow" />
                 </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800 animate-pulse">Searching for Vacancies...</h3>
                <p className="text-sm text-green-600">Checking for latest opportunities...</p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Active Vacancies</h2>
              
              <button
                onClick={handleInitialSearch}
                className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold text-white shadow-md transition-all
                flex items-center justify-center gap-2 mx-auto bg-green-600 hover:bg-green-700 hover:shadow-lg active:transform active:scale-95"
              >
                <Search className="w-5 h-5" />
                Search Vacancies (खोज्नुहोस्)
              </button>

              {lastUpdated && (
                <p className="text-xs text-gray-400 mt-3">
                  Last checked: {lastUpdated}
                </p>
              )}
            </>
          )}
        </div>

        {/* Error State */}
        {loadingState === LoadingState.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Error Occurred</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={() => handleFetch(true)} className="text-xs text-red-600 underline mt-2">Try Again</button>
            </div>
          </div>
        )}

        {/* Content Area */}
        {vacancies.length > 0 && (
          <div className="space-y-6">
            
            {/* AI Summary */}
            {summary && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
                <h3 className="flex items-center gap-2 font-semibold text-yellow-800 mb-2">
                  <FileText className="w-5 h-5" />
                  Summary (सारंश)
                </h3>
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                  {summary}
                </p>
              </div>
            )}
            
            {/* Category Filters */}
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-2 px-2">
               {categories.map((cat) => (
                 <button
                   key={cat}
                   onClick={() => setActiveFilter(cat)}
                   className={`
                     whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all
                     ${activeFilter === cat 
                       ? 'bg-green-600 text-white shadow-md' 
                       : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'}
                   `}
                 >
                   {cat}
                 </button>
               ))}
            </div>

            {/* Vacancy List */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 px-1 flex justify-between items-center">
                <span>
                   {activeFilter !== 'All' ? `${activeFilter} Opportunities` : 'All Opportunities'} 
                   <span className="ml-2 text-sm font-normal text-gray-500">
                     ({filteredVacancies.length})
                   </span>
                </span>
              </h3>
              
              {filteredVacancies.length > 0 ? (
                filteredVacancies.map((vacancy) => (
                  <VacancyCard key={vacancy.id} vacancy={vacancy} />
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-lg border border-gray-200 border-dashed">
                   <p className="text-gray-500">No vacancies found for "{activeFilter}".</p>
                   <button onClick={() => setActiveFilter('All')} className="text-green-600 text-sm font-medium mt-2">View All</button>
                </div>
              )}
            </div>

            {/* Load More Button - Only show if we are viewing All to avoid confusion */}
            {activeFilter === 'All' && (
              <div className="text-center py-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingState === LoadingState.SEARCHING}
                  className={`
                    px-6 py-2.5 rounded-full border border-gray-300 font-medium text-sm transition-all
                    flex items-center justify-center gap-2 mx-auto
                    ${loadingState === LoadingState.SEARCHING 
                      ? 'bg-gray-100 text-gray-400 cursor-wait' 
                      : 'bg-white text-gray-700 hover:bg-green-50 hover:border-green-400 shadow-sm'}
                  `}
                >
                  {loadingState === LoadingState.SEARCHING ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Loading More...
                    </>
                  ) : (
                    <>
                      Load More <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;