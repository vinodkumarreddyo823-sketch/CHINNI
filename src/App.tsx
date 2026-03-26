/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Home, Info, Search, Menu, X, Footprints, Star, Zap, ChevronRight, Facebook, Twitter, Instagram, ArrowRight, Filter, Volume2, VolumeX, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SHOE_ITEMS = [
  {
    id: 1,
    name: "Air Max Velocity",
    brand: "NIKE",
    price: 13279,
    originalPrice: 15999,
    discount: 17,
    rating: 4.9,
    type: "Running",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400&h=300",
    color: "Crimson Red",
    colors: ["#DC2626", "#2563EB", "#111111"],
    sizes: [7, 8, 9, 10, 11],
    isPrime: true
  },
  {
    id: 2,
    name: "Urban Street Low",
    brand: "ADIDAS",
    price: 7428,
    originalPrice: 8950,
    discount: 17,
    rating: 4.7,
    type: "Lifestyle",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=400&h=300",
    color: "Classic White",
    colors: ["#FFFFFF", "#E5E7EB", "#111111"],
    sizes: [6, 7, 8, 9, 10],
    isPrime: true
  },
  {
    id: 3,
    name: "Trail Blazer Pro",
    brand: "PUMA",
    price: 10292,
    originalPrice: 12400,
    discount: 17,
    rating: 4.8,
    type: "Hiking",
    image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=400&h=300",
    color: "Earth Brown",
    colors: ["#78350F", "#451A03", "#064E3B"],
    sizes: [8, 9, 10, 11, 12],
    isPrime: false
  },
  {
    id: 4,
    name: "Court King Elite",
    brand: "REEBOK",
    price: 9212,
    originalPrice: 11099,
    discount: 17,
    rating: 4.6,
    type: "Basketball",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=400&h=300",
    color: "Neon Green",
    colors: ["#BEF264", "#111111", "#FFFFFF"],
    sizes: [7, 8, 9, 10, 11],
    isPrime: true
  },
  {
    id: 5,
    name: "Zenith Walker",
    brand: "NEW BALANCE",
    price: 6245,
    originalPrice: 7525,
    discount: 17,
    rating: 4.5,
    type: "Walking",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400&h=300",
    color: "Sky Blue",
    colors: ["#7DD3FC", "#FFFFFF", "#94A3B8"],
    sizes: [6, 7, 8, 9, 10],
    isPrime: false
  },
  {
    id: 6,
    name: "Midnight Racer",
    brand: "ASICS",
    price: 16558,
    originalPrice: 19950,
    discount: 17,
    rating: 5.0,
    type: "Performance",
    image: "https://images.unsplash.com/photo-1512374382149-4332c6c021f1?auto=format&fit=crop&q=80&w=400&h=300",
    color: "Obsidian Black",
    colors: ["#111111", "#374151", "#1E3A8A"],
    sizes: [7, 8, 9, 10, 11, 12],
    isPrime: true
  }
];

const BRANDS = [
  "NIKE", "ADIDAS", "PUMA", "REEBOK", "NEW BALANCE", "ASICS", "CONVERSE", "VANS"
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<(typeof SHOE_ITEMS[0] & { quantity: number; selectedSize: number; selectedColor: string })[]>([]);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [quickViewId, setQuickViewId] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<number>(1);
  const [reviews, setReviews] = useState<{ [key: number]: { name: string; rating: number; comment: string; date: string }[] }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foot-rush-reviews');
      if (saved) return JSON.parse(saved);
    }
    return {
      1: [{ name: "Rahul S.", rating: 5, comment: "Insane energy return! Best for long runs.", date: "2026-03-20" }],
      2: [{ name: "Priya M.", rating: 4, comment: "Super comfy for daily wear, goes with everything.", date: "2026-03-22" }],
      3: [{ name: "Amit K.", rating: 5, comment: "Rugged and reliable. Great grip on wet trails.", date: "2026-03-24" }],
      4: [{ name: "Vikram R.", rating: 4, comment: "Great ankle support for the court.", date: "2026-03-25" }],
      5: [{ name: "Sneha P.", rating: 5, comment: "Lightweight and breathable. Perfect for walks.", date: "2026-03-21" }],
      6: [{ name: "Karan J.", rating: 5, comment: "Elite performance. Worth every rupee.", date: "2026-03-23" }]
    };
  });
  const [newReview, setNewReview] = useState({ name: "", rating: 5, comment: "" });

  useEffect(() => {
    localStorage.setItem('foot-rush-reviews', JSON.stringify(reviews));
  }, [reviews]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAddReview = (productId: number) => {
    if (!newReview.name || !newReview.comment) return;
    
    const review = {
      ...newReview,
      date: new Date().toISOString().split('T')[0]
    };
    
    setReviews(prev => ({
      ...prev,
      [productId]: [review, ...(prev[productId] || [])]
    }));
    setNewReview({ name: "", rating: 5, comment: "" });
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const addToCart = (item: typeof SHOE_ITEMS[0]) => {
    const size = selectedSize || item.sizes[0];
    const color = selectedColor || item.colors[0];
    
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.selectedSize === size && i.selectedColor === color);
      if (existing) {
        return prev.map(i => (i.id === item.id && i.selectedSize === size && i.selectedColor === color) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, selectedSize: size, selectedColor: color }];
    });
    setIsCartOpen(true);
    setQuickViewId(null);
  };

  const removeFromCart = (id: number, size: number, color: string) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.selectedSize === size && item.selectedColor === color)));
  };

  const buyNow = (item: typeof SHOE_ITEMS[0]) => {
    const size = selectedSize || item.sizes[0];
    const color = selectedColor || item.colors[0];
    setCartItems([{ ...item, quantity: 1, selectedSize: size, selectedColor: color }]);
    setIsCheckoutOpen(true);
    setQuickViewId(null);
  };

  const filteredShoes = SHOE_ITEMS.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const speakDescription = async (item: typeof SHOE_ITEMS[0]) => {
    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      return;
    }

    try {
      setPlayingId(item.id);
      const prompt = `Describe this shoe in an enthusiastic, premium way for a commercial. Keep it under 20 words. 
      Shoe: ${item.brand} ${item.name}. Color: ${item.color}. Type: ${item.type}. Price: ₹${item.price.toLocaleString('en-IN')}.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBlob = await fetch(`data:audio/wav;base64,${base64Audio}`).then(res => res.blob());
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setPlayingId(null);
        audio.play();
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setPlayingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-[#38A144] p-1.5 rounded-lg">
                <Footprints className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter italic">FOOT RUSH</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-10">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="SEARCH KICKS..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-100 border-none rounded-full pl-10 pr-4 py-2 text-[10px] font-black tracking-widest w-48 focus:w-64 transition-all focus:ring-2 focus:ring-[#38A144] outline-none"
                />
              </div>
              <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-[#38A144] transition-colors">Men</a>
              <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-[#38A144] transition-colors">Women</a>
              <a href="#reviews" className="text-xs font-bold uppercase tracking-widest hover:text-[#38A144] transition-colors">Reviews</a>
              <a href="#" className="text-xs font-bold uppercase tracking-widest hover:text-[#38A144] transition-colors text-red-600">Sale</a>
            </div>

            <div className="flex items-center gap-5">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#38A144] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
              <button 
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden bg-white border-b border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-8 space-y-6">
                <a href="#" className="block text-2xl font-black italic tracking-tighter">NEW ARRIVALS</a>
                <a href="#" className="block text-2xl font-black italic tracking-tighter">MEN</a>
                <a href="#" className="block text-2xl font-black italic tracking-tighter">WOMEN</a>
                <a href="#" className="block text-2xl font-black italic tracking-tighter text-red-600">SALE</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative h-[85vh] flex items-center overflow-hidden bg-black text-white">
          <div className="absolute inset-0 z-0 opacity-60">
            <img 
              src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=1920&h=1080" 
              alt="Hero Background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-black tracking-[0.3em] uppercase text-yellow-400">Limited Edition Release</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black italic leading-[0.9] tracking-tighter mb-8">
                SPEED <br /> DEFINED.
              </h1>
              <p className="text-lg text-gray-300 mb-10 max-w-md font-medium leading-relaxed">
                Engineered for the elite. The new Velocity Series combines carbon-fiber tech with ultra-responsive cushioning.
              </p>
              <div className="flex flex-wrap gap-5">
                <button className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-[#38A144] hover:text-white transition-all flex items-center gap-3 group">
                  Shop Collection
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-10 py-5 bg-transparent border-2 border-white/30 text-white font-black uppercase tracking-widest text-xs hover:border-white transition-all">
                  Explore Tech
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Brand Marquee */}
        <section className="py-12 bg-white border-b border-gray-100 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <div key={i} className="mx-12 text-2xl font-black italic tracking-tighter opacity-20 hover:opacity-100 transition-opacity cursor-default">
                {brand}
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
              <div>
                <h2 className="text-4xl font-black italic tracking-tighter mb-4">THE LINEUP</h2>
                <p className="text-gray-500 font-medium">Performance meets street style.</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold hover:border-black transition-all">
                  <Filter className="w-3 h-3" /> Filter
                </button>
                <button className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold hover:bg-[#38A144] transition-all">
                  View All
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredShoes.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden mb-6">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <div className="bg-black text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">
                        {item.type}
                      </div>
                      {item.discount && (
                        <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">
                          -{item.discount}% OFF
                        </div>
                      )}
                      {item.isPrime && (
                        <div className="bg-[#38A144] text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest flex items-center gap-1">
                          <Zap className="w-2 h-2 fill-white" /> PRIME
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setQuickViewId(item.id);
                          setSelectedSize(item.sizes[0]);
                          setSelectedColor(item.colors[0]);
                        }}
                        className="flex-1 bg-black text-white py-4 font-black uppercase tracking-widest text-[10px] border-r border-white/10 hover:bg-[#38A144]"
                      >
                        Quick Select
                      </button>
                    </div>
                  </div>
                    <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-[#38A144] mb-1 tracking-widest">{item.brand}</p>
                      <h3 className="font-black text-lg tracking-tight mb-1 group-hover:text-[#38A144] transition-colors uppercase italic">{item.name}</h3>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(item.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-[9px] font-bold text-gray-400">({reviews[item.id]?.length || 0})</span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{item.color}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="font-black text-lg italic">₹{item.price.toLocaleString('en-IN')}</p>
                        {item.originalPrice && (
                          <p className="text-[10px] text-gray-400 line-through font-bold italic">₹{item.originalPrice.toLocaleString('en-IN')}</p>
                        )}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); speakDescription(item); }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-[#38A144]"
                        title="Listen to description"
                      >
                        {playingId === item.id ? (
                          <VolumeX className="w-4 h-4 animate-pulse text-[#38A144]" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {filteredShoes.length === 0 && (
              <div className="text-center py-20">
                <p className="text-2xl font-black italic tracking-tighter text-gray-300">NO KICKS FOUND FOR "{searchQuery.toUpperCase()}"</p>
              </div>
            )}
          </div>
        </section>

        {/* Community Reviews Section */}
        <section id="reviews" className="py-32 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-black italic tracking-tighter mb-6 uppercase">Community Feedback</h2>
              <p className="text-gray-500 font-medium max-w-2xl mx-auto text-lg">Real feedback from real runners. Join the Foot Rush family and share your experience with our latest drops.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-16">
              {/* Review Submission Form */}
              <div className="lg:col-span-1 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 h-fit sticky top-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-black p-2 rounded-xl">
                    <MessageSquare className="text-white w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase">Write a Review</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Product</label>
                    <select 
                      value={selectedReviewProduct}
                      onChange={(e) => setSelectedReviewProduct(Number(e.target.value))}
                      className="w-full bg-gray-50 border-none px-5 py-4 text-xs font-bold focus:ring-2 focus:ring-[#38A144] rounded-2xl appearance-none cursor-pointer"
                    >
                      {SHOE_ITEMS.map(item => (
                        <option key={item.id} value={item.id}>{item.brand} {item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Name</label>
                    <input 
                      type="text" 
                      placeholder="ENTER NAME"
                      value={newReview.name}
                      onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-50 border-none px-5 py-4 text-xs font-bold focus:ring-2 focus:ring-[#38A144] rounded-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button 
                          key={n}
                          onClick={() => setNewReview(prev => ({ ...prev, rating: n }))}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all ${newReview.rating >= n ? 'bg-yellow-400 border-yellow-400 text-white' : 'bg-white border-gray-100 text-gray-300'}`}
                        >
                          <Star className={`w-4 h-4 mx-auto ${newReview.rating >= n ? 'fill-white' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Thoughts</label>
                    <textarea 
                      placeholder="HOW DO THEY FEEL?"
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full bg-gray-50 border-none px-5 py-4 text-xs font-bold focus:ring-2 focus:ring-[#38A144] rounded-2xl h-32 resize-none"
                    />
                  </div>

                  <button 
                    onClick={() => handleAddReview(selectedReviewProduct)}
                    className="w-full bg-black text-white py-5 font-black uppercase tracking-widest text-xs hover:bg-[#38A144] transition-all rounded-2xl shadow-lg shadow-gray-200"
                  >
                    Post Review
                  </button>
                </div>
              </div>

              {/* Review List */}
              <div className="lg:col-span-2 space-y-10">
                <div className="flex justify-between items-center border-b border-gray-200 pb-6">
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase">
                    Reviews for {SHOE_ITEMS.find(s => s.id === selectedReviewProduct)?.name}
                  </h3>
                  <span className="text-xs font-black bg-black text-white px-4 py-1.5 rounded-full uppercase tracking-widest">
                    {reviews[selectedReviewProduct]?.length || 0} Total
                  </span>
                </div>

                <div className="grid gap-8">
                  {(reviews[selectedReviewProduct] || []).length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No reviews yet for this model. Be the first!</p>
                    </div>
                  ) : (
                    (reviews[selectedReviewProduct] || []).map((review, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#38A144] rounded-full flex items-center justify-center text-white font-black italic">
                              {review.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black italic uppercase tracking-tight">{review.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-100'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 font-medium leading-relaxed text-lg italic">"{review.comment}"</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Statement */}
        <section className="py-32 bg-[#38A144] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 text-[20rem] font-black italic opacity-10 leading-none select-none -translate-y-1/4 translate-x-1/4">
            RUSH
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-10 leading-[0.9]">
                NOT JUST A SHOE. <br /> A STATEMENT.
              </h2>
              <p className="text-xl md:text-2xl font-medium text-green-50 mb-12 leading-relaxed">
                We believe in the power of movement. Our mission is to provide the tools for you to break barriers, set records, and define your own path.
              </p>
              <button className="bg-white text-[#38A144] px-12 py-6 font-black uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all">
                Our Story
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-black italic tracking-tighter">YOUR CART ({cartCount})</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <ShoppingCart className="w-12 h-12 text-gray-200" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Your cart is empty</p>
                  </div>
                ) : (
                  cartItems.map((item, idx) => (
                    <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${idx}`} className="flex gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-black italic text-sm">{item.name}</h3>
                          <button onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)} className="text-gray-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{item.brand}</p>
                        <div className="flex gap-2 mb-2">
                          <span className="text-[9px] font-black bg-gray-100 px-2 py-0.5 rounded uppercase">Size: {item.selectedSize}</span>
                          <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: item.selectedColor }} />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold">QTY: {item.quantity}</p>
                          <p className="font-black italic">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total Amount</p>
                    <p className="text-3xl font-black italic tracking-tighter">₹{cartTotal.toLocaleString('en-IN')}</p>
                  </div>
                  <button 
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full bg-black text-white py-5 font-black uppercase tracking-widest text-xs hover:bg-[#38A144] transition-all"
                  >
                    Checkout Now
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick View / Selection Modal */}
      <AnimatePresence>
        {quickViewId && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewId(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-x-4 bottom-4 top-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl bg-white z-[120] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              {SHOE_ITEMS.filter(s => s.id === quickViewId).map(item => (
                <>
                  <div className="w-full md:w-1/2 bg-gray-100 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setQuickViewId(null)}
                      className="absolute top-6 left-6 p-3 bg-white/80 backdrop-blur-md rounded-full md:hidden"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-[#38A144] mb-2 tracking-widest uppercase">{item.brand}</p>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-2">{item.name}</h2>
                        <div className="flex items-center gap-4">
                          <p className="text-2xl font-black italic">₹{item.price.toLocaleString('en-IN')}</p>
                          <p className="text-sm text-gray-400 line-through font-bold italic">₹{item.originalPrice.toLocaleString('en-IN')}</p>
                          <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">-{item.discount}% OFF</span>
                        </div>
                      </div>
                      <button onClick={() => setQuickViewId(null)} className="hidden md:block p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Color</p>
                      <div className="flex gap-3">
                        {item.colors.map(color => (
                          <button 
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-[#38A144] scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Size (UK)</p>
                      <div className="grid grid-cols-5 gap-2">
                        {item.sizes.map(size => (
                          <button 
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`py-3 text-xs font-black rounded-lg border transition-all ${selectedSize === size ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-200 hover:border-black'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => addToCart(item)}
                        className="flex-1 bg-black text-white py-5 font-black uppercase tracking-widest text-xs hover:bg-[#38A144] transition-all"
                      >
                        Add to Cart
                      </button>
                      <button 
                        onClick={() => buyNow(item)}
                        className="flex-1 bg-[#38A144] text-white py-5 font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
                      >
                        Buy Now
                      </button>
                    </div>

                    {/* Reviews Section */}
                    <div className="pt-10 border-t border-gray-100 space-y-8">
                      <h3 className="text-xl font-black italic tracking-tighter uppercase">Customer Reviews</h3>
                      
                      {/* Review Form */}
                      <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Write a Review</p>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            placeholder="YOUR NAME"
                            value={newReview.name}
                            onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                            className="bg-white border-none px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-[#38A144] rounded-lg"
                          />
                          <select 
                            value={newReview.rating}
                            onChange={(e) => setNewReview(prev => ({ ...prev, rating: Number(e.target.value) }))}
                            className="bg-white border-none px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-[#38A144] rounded-lg"
                          >
                            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                          </select>
                        </div>
                        <textarea 
                          placeholder="YOUR THOUGHTS..."
                          value={newReview.comment}
                          onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                          className="w-full bg-white border-none px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-[#38A144] rounded-lg h-24"
                        />
                        <button 
                          onClick={() => handleAddReview(item.id)}
                          className="w-full bg-black text-white py-3 font-black uppercase tracking-widest text-[10px] hover:bg-[#38A144] transition-colors rounded-lg"
                        >
                          Submit Review
                        </button>
                      </div>

                      {/* Review List */}
                      <div className="space-y-6">
                        {(reviews[item.id] || []).map((review, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-xs font-black uppercase tracking-widest">{review.name}</p>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">{review.comment}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{review.date}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delivery / Checkout Page */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-white z-[100] overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto px-4 py-12">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-2">
                  <div className="bg-black p-1.5 rounded-lg">
                    <Footprints className="text-white w-5 h-5" />
                  </div>
                  <span className="text-xl font-black tracking-tighter italic">FOOT RUSH</span>
                </div>
                <button onClick={() => setIsCheckoutOpen(false)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-[#38A144]">
                  <X className="w-4 h-4" /> Close
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-16">
                <div className="space-y-10">
                  <h2 className="text-4xl font-black italic tracking-tighter">DELIVERY INFO</h2>
                  <form className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">First Name</label>
                        <input type="text" className="w-full bg-gray-50 border-none p-4 text-sm font-bold focus:ring-2 focus:ring-black" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last Name</label>
                        <input type="text" className="w-full bg-gray-50 border-none p-4 text-sm font-bold focus:ring-2 focus:ring-black" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Address</label>
                      <input type="text" className="w-full bg-gray-50 border-none p-4 text-sm font-bold focus:ring-2 focus:ring-black" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">City</label>
                        <input type="text" className="w-full bg-gray-50 border-none p-4 text-sm font-bold focus:ring-2 focus:ring-black" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pincode</label>
                        <input type="text" className="w-full bg-gray-50 border-none p-4 text-sm font-bold focus:ring-2 focus:ring-black" />
                      </div>
                    </div>
                  </form>
                </div>

                <div className="bg-gray-50 p-8 rounded-3xl h-fit space-y-8">
                  <h3 className="text-xl font-black italic tracking-tighter">ORDER SUMMARY</h3>
                  <div className="space-y-4">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="font-bold text-gray-500">{item.name} x {item.quantity}</span>
                        <span className="font-black italic">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-gray-200 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-gray-400">Shipping</span>
                      <span className="font-black italic text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase tracking-widest">Total</span>
                      <span className="text-3xl font-black italic tracking-tighter">₹{cartTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <button className="w-full bg-black text-white py-6 font-black uppercase tracking-widest text-sm hover:bg-[#38A144] transition-all shadow-xl shadow-green-100">
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white text-black pt-24 pb-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <div className="bg-[#38A144] p-1.5 rounded-lg">
                  <Footprints className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tighter italic">FOOT RUSH</span>
              </div>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Premium footwear engineered for performance and style. Join the rush and redefine your limits.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-gray-400 hover:text-black transition-colors"><Facebook className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-black transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-black transition-colors"><Instagram className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-8">Shop</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li><a href="#" className="hover:text-[#38A144] transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-[#38A144] transition-colors">Best Sellers</a></li>
                <li><a href="#" className="hover:text-[#38A144] transition-colors">Men's Collection</a></li>
                <li><a href="#" className="hover:text-[#38A144] transition-colors">Women's Collection</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-8">Support</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li><a href="#" className="hover:text-[#38A144] transition-colors">Shipping & Returns</a></li>
                <li><a href="#" className="hover:text-[#38A144] transition-colors">Size Guide</a></li>
                <li><a href="#" className="hover:text-[#38A144] transition-colors">Order Tracking</a></li>
                <li><a href="#" className="hover:text-[#38A144] transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-8">Join the Rush</h4>
              <p className="text-sm font-medium text-gray-500 mb-6">Get early access to drops and exclusive offers.</p>
              <div className="flex flex-col gap-3">
                <input 
                  type="email" 
                  placeholder="EMAIL ADDRESS" 
                  className="bg-gray-100 border-none px-5 py-4 text-xs font-bold tracking-widest focus:ring-2 focus:ring-black"
                />
                <button className="bg-black text-white py-4 font-black uppercase tracking-widest text-xs hover:bg-[#38A144] transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <p>© 2026 FOOT RUSH. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-[#38A144] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#38A144] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#38A144] transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
