"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useQuickAuth } from "@coinbase/onchainkit/minikit";


export default function Home() {
  const { setMiniAppReady, isMiniAppReady, context } = useMiniKit();
  const { data: authData } = useQuickAuth<{
    userFid: string;
  }>("/api/auth");

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [setMiniAppReady, isMiniAppReady]);

  const user = context?.user;
  const fid = user?.fid || authData?.userFid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">

      <main className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-7xl md:text-8xl font-light text-white mb-6 tracking-tighter">
            noFlake
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            noFlake lets you host free events or stake-backed &quot;no-flake&quot; events on Base. Share a simple link, collect the info you need from guests, and turn casual maybes into real commitments.
          </p>
          
          {fid && (
            <div className="inline-block bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-3 mb-8 border border-white/10">
              <p className="text-white/90 font-light text-sm">
                Welcome back, FID: {fid}
                {user?.username && ` (@${user.username})`}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/events/create"
              className="bg-white text-purple-900 px-8 py-3.5 rounded-xl font-medium text-base hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              Create event
            </Link>
            <Link
              href="/events"
              className="bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-xl font-medium text-base hover:bg-white/20 transition-all border border-white/20 w-full sm:w-auto"
            >
              Browse events
            </Link>
          </div>
        </div>

        {/* Why noFlake? Section */}
        <div className="mb-20">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-12 text-center tracking-tight">
            Why noFlake?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all">
              <h3 className="text-xl font-medium text-white mb-3 tracking-tight">
                Crypto-native by default
              </h3>
              <p className="text-gray-300 text-sm font-light leading-relaxed">
                Built on Base, so your events and commitments live onchain – not lost in group chats.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all">
              <h3 className="text-xl font-medium text-white mb-3 tracking-tight">
                Free or stake-backed events
              </h3>
              <p className="text-gray-300 text-sm font-light leading-relaxed">
                Host casual free events, or turn on the noFlake plan where guests stake a small amount when they say &quot;I&apos;m in.&quot;
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all">
              <h3 className="text-xl font-medium text-white mb-3 tracking-tight">
                Simple links, serious RSVPs
              </h3>
              <p className="text-gray-300 text-sm font-light leading-relaxed">
                Share one clean event page, collect the info you need, and make it easy for people to actually show up.
              </p>
            </div>
          </div>
        </div>

        {/* How noFlake works Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 md:p-12 border border-white/10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4 text-center tracking-tight">
              How noFlake works
            </h2>
            <p className="text-gray-300 text-center mb-12 font-light text-lg">
              From idea to onchain commitment in a few simple steps.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4 md:gap-6">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-light text-lg md:text-xl">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-2 text-lg">Choose your plan</h4>
                  <p className="text-gray-300 text-sm font-light leading-relaxed">
                    Pick between a free event or a noFlake stake-backed event on Base.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 md:gap-6">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-light text-lg md:text-xl">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-2 text-lg">Create your event</h4>
                  <p className="text-gray-300 text-sm font-light leading-relaxed">
                    Add the basics – title, description, time, place – and configure which info you want to collect from each guest.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 md:gap-6">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-light text-lg md:text-xl">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-2 text-lg">Share the link</h4>
                  <p className="text-gray-300 text-sm font-light leading-relaxed">
                    Send your event page to friends or your crypto community on Base app, Farcaster, Telegram, X, and more.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 md:gap-6">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-light text-lg md:text-xl">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-2 text-lg">Guests join and commit</h4>
                  <p className="text-gray-300 text-sm font-light leading-relaxed">
                    Guests fill out your registration form. For noFlake events, they lock a small deposit (e.g. 5 USDC on Base) when they say &quot;I&apos;m coming.&quot;
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 md:gap-6">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-light text-lg md:text-xl">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-2 text-lg">Show up day</h4>
                  <p className="text-gray-300 text-sm font-light leading-relaxed">
                    You see who committed and who joined. Over time we can plug in check-in, payouts, and bill-splitting – but for now the focus is clear, stake-backed RSVPs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
