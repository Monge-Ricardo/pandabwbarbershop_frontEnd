import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader } from 'lucide-react';
import {
  CACHE_TTL,
  cachedPublicRequest,
  getPublicCachedRequestData,
} from '../api/api';

interface Service {
  service_id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string;
}

interface Barber {
  id: string;
  full_name: string;
  barbershop_name: string;
  barbershop_id?: string;
}

interface Barbershop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number | null;
  longitude: number | null;
}

const loadGoogleMapsScript = (callback: () => void) => {
  if ((window as any).google && (window as any).google.maps) {
    callback();
    return;
  }
  const existingScript = document.getElementById('googleMapsScript');
  if (existingScript) {
    existingScript.addEventListener('load', callback);
    return;
  }
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.id = 'googleMapsScript';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    if (callback) callback();
  };
  document.head.appendChild(script);
};

export default function LandingPage() {
  const [initialPublicCache] = useState(() => {
    const cachedServices = getPublicCachedRequestData<Service[]>(
      '/api/customer/services',
      CACHE_TTL.LANDING_PUBLIC,
    );
    const cachedBarbers = getPublicCachedRequestData<{ data: Barber[] }>(
      '/api/customer/barbers',
      CACHE_TTL.LANDING_PUBLIC,
    );
    const cachedBarbershops = getPublicCachedRequestData<Barbershop[]>(
      '/barbershops',
      CACHE_TTL.LANDING_PUBLIC,
    );

    return {
      services: cachedServices,
      barbers: cachedBarbers?.data ?? null,
      barbershops: cachedBarbershops,
    };
  });

  const hasCompletePublicCache =
    initialPublicCache.services !== null &&
    initialPublicCache.barbers !== null &&
    initialPublicCache.barbershops !== null;

  const [services, setServices] = useState<Service[]>(
    initialPublicCache.services ?? [],
  );
  const [barbers, setBarbers] = useState<Barber[]>(
    initialPublicCache.barbers ?? [],
  );
  const [barbershops, setBarbershops] = useState<Barbershop[]>(
    initialPublicCache.barbershops ?? [],
  );
  const [loading, setLoading] = useState(!hasCompletePublicCache);
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselSlides = [
    {
      image: '/img/carousel-1.jpg',
      title: 'Barbería PANDA Black And White',
      subtitle: 'Calle Inés Gangotena con Av. Atahualpa',
      detail: 'Atención de 10:00 a.m. a 8:30 p.m.',
      iconClass: 'fa-map-marker-alt'
    },
    {
      image: '/img/carousel-2.jpg',
      title: 'Cortes, barba y cejas con estilo profesional',
      subtitle: 'Reserva tu cita o acude por llegada libre',
      detail: 'Servicios desde $1.00',
      iconClass: 'fa-cut'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      const fallbackServices: Service[] = [
        { service_id: '1', name: 'Corte de Cabello Premium', price: 10.00, duration_minutes: 30, description: 'Estilo clásico o moderno adaptado a tus facciones.' },
        { service_id: '2', name: 'Arreglo de Barba Tradicional', price: 7.00, duration_minutes: 20, description: 'Modelado, toalla caliente y loción hidratante.' },
        { service_id: '3', name: 'Diseño y Arreglo de Cejas', price: 4.00, duration_minutes: 15, description: 'Perfilado profesional para complementar tu mirada.' },
        { service_id: '4', name: 'Combo Panda Completo', price: 18.00, duration_minutes: 50, description: 'Corte premium + arreglo de barba + cejas de cortesía.' }
      ];

      const fallbackBarbers: Barber[] = [
        { id: 'b1', full_name: 'Gabriel Molina', barbershop_name: 'PANDA Black & White Central' },
        { id: 'b2', full_name: 'Alejandro Obando', barbershop_name: 'PANDA Black & White Central' },
        { id: 'b3', full_name: 'Ricardo Monge', barbershop_name: 'PANDA Black & White Central' }
      ];

      const fallbackBarbershops: Barbershop[] = [
        {
          id: 'shop1',
          name: 'PANDA Black & White Central',
          address: 'Calle Inés Gangotena con Av. Atahualpa, Quito',
          phone: '+593 99 999 9999',
          email: 'info@barberiapanda.com',
          latitude: -0.180653,
          longitude: -78.467834
        }
      ];

      const [servicesResult, barbersResult, shopsResult] = await Promise.allSettled([
        cachedPublicRequest<Service[]>(
          '/api/customer/services',
          CACHE_TTL.LANDING_PUBLIC,
        ),
        cachedPublicRequest<{ data: Barber[] }>(
          '/api/customer/barbers',
          CACHE_TTL.LANDING_PUBLIC,
        ),
        cachedPublicRequest<Barbershop[]>(
          '/barbershops',
          CACHE_TTL.LANDING_PUBLIC,
        ),
      ]);

      if (servicesResult.status === 'fulfilled') {
        setServices(servicesResult.value || []);
      } else {
        console.error('Error loading services, using fallbacks:', servicesResult.reason);
        setServices(fallbackServices);
      }

      if (barbersResult.status === 'fulfilled') {
        setBarbers(barbersResult.value.data || []);
      } else {
        console.error('Error loading barbers, using fallbacks:', barbersResult.reason);
        setBarbers(fallbackBarbers);
      }

      if (shopsResult.status === 'fulfilled') {
        setBarbershops(shopsResult.value || []);
      } else {
        console.error('Error loading barbershops, using fallbacks:', shopsResult.reason);
        setBarbershops(fallbackBarbershops);
      }

      setLoading(false);
    }

    void loadData();
  }, []);

  useEffect(() => {
    if (barbershops.length > 0) {
      loadGoogleMapsScript(() => {
        const mapEl = document.getElementById('google-map-element');
        if (mapEl && (window as any).google && (window as any).google.maps) {
          const defaultShop = barbershops.find(s => s.latitude && s.longitude);
          const center = defaultShop 
            ? { lat: Number(defaultShop.latitude), lng: Number(defaultShop.longitude) } 
            : { lat: -0.180653, lng: -78.467834 };

          const map = new (window as any).google.maps.Map(mapEl, {
            center: center,
            zoom: 13,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
              {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
              },
              {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
              },
              {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#263c3f' }]
              },
              {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#6b9a76' }]
              },
              {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#38414e' }]
              },
              {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#212a37' }]
              },
              {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9ca5b3' }]
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{ color: '#746855' }]
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#1f2835' }]
              },
              {
                featureType: 'road.highway',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#f3d19c' }]
              },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#17263c' }]
              },
              {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#515c6d' }]
              },
              {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#17263c' }]
              }
            ]
          });

          barbershops.forEach(shop => {
            if (shop.latitude && shop.longitude) {
              const marker = new (window as any).google.maps.Marker({
                position: { lat: Number(shop.latitude), lng: Number(shop.longitude) },
                map: map,
                title: shop.name,
                animation: (window as any).google.maps.Animation.DROP
              });

              const infoWindow = new (window as any).google.maps.InfoWindow({
                content: `
                  <div style="color: #000; padding: 10px; font-family: Arial, sans-serif;">
                    <h5 style="margin: 0 0 5px 0; color: #D4AF37;">${shop.name}</h5>
                    <p style="margin: 0 0 5px 0; font-size: 13px;">${shop.address}</p>
                    ${shop.phone ? `<p style="margin: 0; font-size: 12px; color: #555;"><b>Tlf:</b> ${shop.phone}</p>` : ''}
                  </div>
                `
              });

              marker.addListener('click', () => {
                infoWindow.open(map, marker);
              });
            }
          });
        }
      });
    }
  }, [barbershops]);

  if (loading) {
    return (
      <div className="vh-100 bg-dark d-flex align-items-center justify-content-center text-primary">
        <div className="text-center">
          <Loader className="animate-spin text-primary" size={48} />
          <h4 className="text-uppercase mt-3 text-white">Cargando...</h4>
        </div>
      </div>
    );
  }

  const serviceImages = [
    '/img/haircut.png',
    '/img/beard-trim.png',
    '/img/mans-shave.png',
    '/img/hair-dyeing.png'
  ];

  return (
    <div className="bg-dark text-white overflow-hidden">
      {/* Navbar Start */}
      <nav className="navbar navbar-expand-lg bg-secondary navbar-dark sticky-top py-lg-0 px-lg-5">
        <a href="/" className="navbar-brand ms-4 ms-lg-0">
          <div className="d-flex align-items-center">
            <img 
              src="/img/BarberShop_PandaBlackAndWhite.png" 
              alt="Logo" 
              style={{ height: '58px', width: 'auto', marginRight: '12px' }} 
            />
            <h1 className="mb-0 text-primary text-uppercase fs-4 d-none d-md-block">
              Barbería PANDA Black And White
            </h1>
            <h1 className="mb-0 text-primary text-uppercase fs-5 d-block d-md-none">
              PANDA B&W
            </h1>
          </div>
        </a>
        <div className="ms-auto p-4 p-lg-0 d-flex align-items-center gap-3">
          <a href="#about" className="nav-item nav-link d-none d-lg-block text-uppercase">Nosotros</a>
          <a href="#services" className="nav-item nav-link d-none d-lg-block text-uppercase">Servicios</a>
          <a href="#team" className="nav-item nav-link d-none d-lg-block text-uppercase">Barberos</a>
          <a href="#contact" className="nav-item nav-link d-none d-lg-block text-uppercase">Contacto</a>
          
          <Link to="/login" className="btn btn-primary rounded-0 py-2 px-lg-4 align-self-center">
            Agendar Cita
            <i className="fa fa-arrow-right ms-3"></i>
          </Link>
        </div>
      </nav>
      {/* Navbar End */}

      {/* Carousel Start */}
      <div className="container-fluid p-0 mb-5">
        <div id="header-carousel" className="carousel slide" data-bs-ride="carousel">
          <div className="carousel-inner">
            <div className={`carousel-item ${currentSlide === 0 ? 'active' : ''}`}>
              <img className="w-100" src={carouselSlides[0].image} alt="Carousel item" style={{ maxHeight: '75vh', objectFit: 'cover' }} />
              <div className="carousel-caption d-flex align-items-center justify-content-center text-start">
                <div className="mx-sm-5 px-5" style={{ maxWidth: '900px' }}>
                  <h1 className="display-4 text-white text-uppercase mb-4 animated slideInDown">
                    {carouselSlides[0].title}
                  </h1>
                  <h4 className="text-white text-uppercase mb-3">
                    <i className={`fa ${carouselSlides[0].iconClass} text-primary me-3`}></i>
                    {carouselSlides[0].subtitle}
                  </h4>
                  <h4 className="text-white text-uppercase mb-4">
                    <i className="fa fa-clock text-primary me-3"></i>
                    {carouselSlides[0].detail}
                  </h4>
                </div>
              </div>
            </div>
            <div className={`carousel-item ${currentSlide === 1 ? 'active' : ''}`}>
              <img className="w-100" src={carouselSlides[1].image} alt="Carousel item" style={{ maxHeight: '75vh', objectFit: 'cover' }} />
              <div className="carousel-caption d-flex align-items-center justify-content-center text-start">
                <div className="mx-sm-5 px-5" style={{ maxWidth: '900px' }}>
                  <h1 className="display-4 text-white text-uppercase mb-4 animated slideInDown">
                    {carouselSlides[1].title}
                  </h1>
                  <h4 className="text-white text-uppercase mb-3">
                    <i className="fa fa-calendar-alt text-primary me-3"></i>
                    {carouselSlides[1].subtitle}
                  </h4>
                  <h4 className="text-white text-uppercase mb-4">
                    <i className={`fa ${carouselSlides[1].iconClass} text-primary me-3`}></i>
                    {carouselSlides[1].detail}
                  </h4>
                </div>
              </div>
            </div>
          </div>
          <button className="carousel-control-prev" type="button" onClick={() => setCurrentSlide((currentSlide - 1 + 2) % 2)}>
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Anterior</span>
          </button>
          <button className="carousel-control-next" type="button" onClick={() => setCurrentSlide((currentSlide + 1) % 2)}>
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Siguiente</span>
          </button>
        </div>
      </div>
      {/* Carousel End */}

      {/* About Start */}
      <div className="container-xxl py-5" id="about">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-6">
              <div className="d-flex flex-column">
                <img className="img-fluid w-75 align-self-end" src="/img/about.jpg" alt="About us" />
                <div className="w-50 bg-secondary p-4 p-md-5" style={{ marginTop: '-25%' }}>
                  <h1 className="text-uppercase text-primary mb-3" style={{ fontSize: '2rem' }}>25 Años</h1>
                  <h2 className="text-uppercase mb-0 text-white" style={{ fontSize: '1.25rem' }}>De Experiencia</h2>
                </div>
              </div>
            </div>
            <div className="col-lg-6 text-start">
              <p className="d-inline-block bg-secondary text-primary py-1 px-4">Nosotros</p>
              <h1 className="text-uppercase mb-4 text-white">¡Más que una barbería, un espacio para renovar tu estilo!</h1>
              <p className="text-muted">
                Barbería PANDA Black And White ofrece servicios de corte, barba y arreglo de cejas,
                brindando atención personalizada a cada cliente.
              </p>
              <p className="mb-4 text-muted">
                Nuestro objetivo es ofrecer un servicio práctico, accesible y profesional,
                adaptado al tiempo y al estilo que cada persona necesita.
              </p>
              <div className="row g-4">
                <div className="col-md-6">
                  <h3 className="text-uppercase text-white mb-3" style={{ fontSize: '1.15rem' }}>Horario de atención</h3>
                  <p className="mb-0 text-muted">
                    Atendemos desde las 10:00 a.m. hasta las 8:30 p.m.,
                    con opción de cita o llegada libre.
                  </p>
                </div>
                <div className="col-md-6">
                  <h3 className="text-uppercase text-white mb-3" style={{ fontSize: '1.15rem' }}>Ubicación</h3>
                  <p className="mb-0 text-muted">
                    Nos encontramos en la Calle Inés Gangotena con Av. Atahualpa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* About End */}

      {/* Service Start */}
      <div className="container-xxl py-5" id="services">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '600px' }}>
            <p className="d-inline-block bg-secondary text-primary py-1 px-4">Servicios</p>
            <h1 className="text-uppercase text-white">Lo que ofrecemos</h1>
          </div>
          
          <div className="row g-4">
            {services.map((service, index) => (
              <div key={service.service_id} className="col-lg-4 col-md-6 text-start">
                <div className="service-item position-relative overflow-hidden bg-secondary d-flex h-100 p-5 ps-0">
                  <div className="bg-dark d-flex flex-shrink-0 align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                    <img className="img-fluid" src={serviceImages[index % serviceImages.length]} alt={service.name} style={{ width: '32px' }} />
                  </div>
                  <div className="ps-4">
                    <h3 className="text-uppercase text-white mb-3" style={{ fontSize: '1.25rem' }}>{service.name}</h3>
                    <p className="text-muted text-sm">{service.description || `Tiempo aproximado: ${service.duration_minutes} minutos.`}</p>
                    <span className="text-uppercase text-primary font-weight-bold">Desde ${Number(service.price).toFixed(2)}</span>
                  </div>
                  <Link className="btn btn-square" to="/login"><i className="fa fa-plus text-primary"></i></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Service End */}

      {/* Team Start */}
      <div className="container-xxl py-5" id="team">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '600px' }}>
            <p className="d-inline-block bg-secondary text-primary py-1 px-4">Barberos</p>
            <h1 className="text-uppercase text-white">Nuestro Equipo</h1>
          </div>
          
          <div className="row g-4">
            {barbers.map((barber, index) => (
              <div key={`${barber.barbershop_id || barber.barbershop_name}-${barber.id}`} className="col-lg-4 col-md-6">
                <div className="team-item">
                  <div className="team-img position-relative overflow-hidden">
                    <img className="img-fluid w-100" src={`/img/team-${(index % 4) + 1}.jpg`} alt={barber.full_name} style={{ objectFit: 'cover', height: '350px' }} />
                    <div className="team-social">
                      <a className="btn btn-square" href=""><i className="fab fa-facebook-f"></i></a>
                      <a className="btn btn-square" href=""><i className="fab fa-twitter"></i></a>
                      <a className="btn btn-square" href=""><i className="fab fa-instagram"></i></a>
                    </div>
                  </div>
                  <div className="bg-secondary text-center p-4">
                    <h5 className="text-uppercase text-white mb-1">{barber.full_name}</h5>
                    <span className="text-primary">{barber.barbershop_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Team End */}

      {/* Working Hours Start */}
      <div className="container-xxl py-5" id="hours">
        <div className="container">
          <div className="row g-0">
            <div className="col-lg-6">
              <div className="h-100">
                <img className="img-fluid h-100 w-100" src="/img/open.jpg" alt="Open hours" style={{ objectFit: 'cover', maxHeight: '400px' }} />
              </div>
            </div>
            <div className="col-lg-6 text-start">
              <div className="bg-secondary h-100 d-flex flex-column justify-content-center p-5">
                <p className="d-inline-flex bg-dark text-primary py-1 px-4 me-auto">Horario de Atención</p>
                <h1 className="text-uppercase mb-4 text-white">Te esperamos en Barbería PANDA Black And White</h1>
                <div>
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <h6 className="text-uppercase mb-0 text-white">Horario</h6>
                    <span className="text-uppercase text-muted">10:00 a.m. - 8:30 p.m.</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <h6 className="text-uppercase mb-0 text-white">Modalidad</h6>
                    <span className="text-uppercase text-muted">Cita o llegada libre</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom py-2">
                    <h6 className="text-uppercase mb-0 text-white">Ubicación</h6>
                    <span className="text-uppercase text-muted">Inés Gangotena y Av. Atahualpa</span>
                  </div>
                </div>
                <p className="mt-4 mb-0 text-muted">
                  Puedes reservar una cita o acudir por llegada libre, dependiendo de la disponibilidad.
                  El tiempo de atención depende del servicio solicitado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Working Hours End */}

      {/* Contact Start */}
      <div className="container-xxl py-5" id="contact">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '600px' }}>
            <p className="d-inline-block bg-secondary text-primary py-1 px-4">Contacto</p>
            <h1 className="text-uppercase text-white">Nuestras Sucursales</h1>
          </div>
          
          <div className="row g-4 text-start">
            <div className="col-lg-4 d-flex flex-column gap-4">
              <div className="bg-secondary p-4 text-center d-flex flex-column align-items-center justify-content-center" style={{ flex: 1 }}>
                <i className="fa-solid fa-map-pin text-primary mb-3" style={{ fontSize: '2rem' }}></i>
                <h5 className="text-white text-uppercase">Ubicaciones</h5>
                <p className="text-muted mb-0">Encuentra tu sucursal más cercana en el mapa</p>
              </div>
              <div className="bg-secondary p-4 text-center d-flex flex-column align-items-center justify-content-center" style={{ flex: 1 }}>
                <i className="fa-solid fa-phone text-primary mb-3" style={{ fontSize: '2rem' }}></i>
                <h5 className="text-white text-uppercase">Llámanos</h5>
                <p className="text-muted mb-0">+593 99 999 9999</p>
              </div>
              <div className="bg-secondary p-4 text-center d-flex flex-column align-items-center justify-content-center" style={{ flex: 1 }}>
                <i className="fa-solid fa-envelope text-primary mb-3" style={{ fontSize: '2rem' }}></i>
                <h5 className="text-white text-uppercase">Escríbenos</h5>
                <p className="text-muted mb-0">info@barberiapanda.com</p>
              </div>
            </div>
            
            <div className="col-lg-8">
              <div 
                id="google-map-element" 
                className="w-100 rounded border" 
                style={{ height: '450px', borderColor: '#D4AF37', minHeight: '300px' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      {/* Contact End */}

      {/* Footer Start */}
      <footer className="bg-black py-4 border-t border-border-color text-center text-xs text-muted">
        <p className="mb-0">&copy; {new Date().getFullYear()} Barbería PANDA Black And White. Todos los derechos reservados.</p>
        <p className="mt-2 mb-0 text-white/30" style={{ fontSize: '0.75rem' }}>SharkHub Decoupled Frontend Module 1</p>
      </footer>
      {/* Footer End */}
    </div>
  );
}
