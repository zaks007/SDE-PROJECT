import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';

import { MapPin, Leaf, Users, Calendar, CreditCard, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { gardenApi, userApi, bookingApi } from '@/lib/api';

interface Garden {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  base_price_per_month: number;
  available_plots: number;
  total_plots: number;
  size_sqm: number | null;
  amenities: string[] | null;
  images: string[] | null;
  owner_id: string;
}

interface Owner {
  id: string;
  full_name: string;
  email: string;
}

const GardenDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [garden, setGarden] = useState<Garden | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [months, setMonths] = useState([3]);
  const [isBooking, setIsBooking] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (id) fetchGarden();
  }, [id]);

  // ------------------------------------------------------
  // FETCH GARDEN + OWNER FROM SPRING BOOT
  // ------------------------------------------------------
  const fetchGarden = async () => {
    try {
      const apiGarden = await gardenApi.getById(id!);

      const mappedGarden: Garden = {
        id: apiGarden.id,
        name: apiGarden.name,
        description: apiGarden.description,
        address: apiGarden.address,
        latitude: 0,
        longitude: 0,
        base_price_per_month: apiGarden.basePricePerMonth,
        available_plots: apiGarden.availablePlots,
        total_plots: apiGarden.totalPlots,
        size_sqm: apiGarden.sizeSqm,
        amenities: apiGarden.amenities,
        images: apiGarden.images,
        owner_id: apiGarden.ownerId
      };

      setGarden(mappedGarden);

      if (apiGarden.ownerId) {
        const ownerData = await userApi.getById(apiGarden.ownerId);
        setOwner({
          id: ownerData.id,
          full_name: ownerData.fullName,
          email: ownerData.email
        });
      }
    } catch (error) {
      toast.error('Failed to load garden');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice =
    garden?.base_price_per_month ? garden.base_price_per_month * months[0] : 0;

  // ------------------------------------------------------
  // BOOKING HANDLER
  // ------------------------------------------------------
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to make a booking');
      return navigate('/auth');
    }

    // Card validations (kept as is)
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      return toast.error('Card number must be 16 digits');
    }

    const [expMonth, expYear] = expDate.split('/');
    const currentYear = new Date().getFullYear();
    const year = parseInt('20' + expYear);
    const month = parseInt(expMonth);

    if (year < currentYear || (year === currentYear && month < new Date().getMonth() + 1)) {
      return toast.error('Card expired');
    }

    if (cvv.length !== 3) {
      return toast.error('CVV must be 3 digits');
    }

    setIsBooking(true);

    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months[0]);

      await bookingApi.create({
        gardenId: garden?.id,
        userId: user.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        durationMonths: months[0],
        totalPrice: totalPrice,
        status: 'confirmed',
        paymentMethod: 'credit_card'
      });

      toast.success('Booking confirmed!');
      setIsDialogOpen(false);
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      toast.error('Booking failed');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading || !garden) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-6xl mx-auto py-12 px-4">
        {/* IMAGES */}
        <div className="relative mb-8">
          {garden.images && garden.images.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {garden.images.map((img, idx) => (
                  <CarouselItem key={idx}>
                    <div className="relative h-96 rounded-xl overflow-hidden">
                      <img src={img} className="w-full h-full object-cover" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {garden.images.length > 1 && (
                <>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="h-96 rounded-xl bg-gradient-to-br from-sage to-forest flex items-center justify-center">
              <Leaf className="h-28 w-28 text-white/40" />
            </div>
          )}

          {garden.available_plots === 0 && (
            <Badge className="absolute top-4 right-4 bg-destructive text-lg px-4">
              Fully Booked
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SECTION */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-4xl font-bold">{garden.name}</h1>

            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <MapPin className="h-5 w-5" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  garden.address
                )}`}
                target="_blank"
                className="hover:text-primary hover:underline"
              >
                {garden.address}
              </a>
            </div>

            {/* ABOUT */}
            <Card>
              <CardHeader>
                <CardTitle>About this Garden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{garden.description}</p>

                {garden.size_sqm && (
                  <p>
                    <strong>Size:</strong> {garden.size_sqm} m²
                  </p>
                )}

                {garden.amenities && garden.amenities.length > 0 && (
                  <div>
                    <strong className="block mb-2">Amenities:</strong>
                    <div className="flex flex-wrap gap-2">
                      {garden.amenities.map((a, i) => (
                        <Badge key={i} variant="secondary">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OWNER */}
            {owner && (
              <Card>
                <CardHeader>
                  <CardTitle>Garden Owner</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{owner.full_name}</p>

                      {/* SEND EMAIL (GMAIL) */}
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${owner.email}`}
                        target="_blank"
                        className="flex gap-2 items-center text-primary hover:underline mt-1"
                      >
                        <Mail className="h-4 w-4" />
                        Send Email
                      </a>
                    </div>

                    {/* VIEW PROFILE */}
                    {user && user.id !== owner.id && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/profile/${owner.id}`)}
                      >
                        View Profile
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* BOOKING CARD */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{garden.base_price_per_month} Ft/month</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {garden.available_plots} of {garden.total_plots} plots
                  available
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Duration Slider */}
                <div>
                  <Label>Duration: {months[0]} month(s)</Label>
                  <Slider min={1} max={12} step={1} value={months} onValueChange={setMonths} />
                </div>

                {/* PRICE SUMMARY */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Base price</span>
                    <span>{garden.base_price_per_month} Ft</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Months</span>
                    <span>{months[0]}</span>
                  </div>

                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{totalPrice} Ft</span>
                  </div>
                </div>

                {/* BOOK BUTTON */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={garden.available_plots === 0}
                      onClick={() => {
                        if (!user) {
                          toast.error('Please sign in');
                          navigate('/auth');
                        }
                      }}
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      {garden.available_plots === 0 ? 'Fully Booked' : 'Reserve Plot'}
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Complete Your Booking</DialogTitle>
                      <DialogDescription>
                        Enter your payment details to confirm your booking.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleBooking} className="space-y-4">
                      <div>
                        <Label>Card Number</Label>
                        <Input
                          value={cardNumber}
                          maxLength={19}
                          placeholder="1234 5678 9012 3456"
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\s/g, '');
                            if (/^\d*$/.test(raw) && raw.length <= 16) {
                              setCardNumber(raw.match(/.{1,4}/g)?.join(' ') || raw);
                            }
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Expiry</Label>
                          <Input
                            placeholder="MM/YY"
                            maxLength={5}
                            value={expDate}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              if (raw.length <= 4) {
                                setExpDate(
                                  raw.length >= 3
                                    ? `${raw.slice(0, 2)}/${raw.slice(2)}`
                                    : raw
                                );
                              }
                            }}
                          />
                        </div>

                        <div>
                          <Label>CVV</Label>
                          <Input
                            maxLength={3}
                            value={cvv}
                            placeholder="123"
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              if (raw.length <= 3) setCvv(raw);
                            }}
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={isBooking} className="w-full">
                        {isBooking ? 'Processing…' : 'Confirm & Pay'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardenDetail;
