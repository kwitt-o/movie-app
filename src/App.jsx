import { useState, useEffect, use } from 'react'
import Search from './components/search'
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { updateSearchCount, getTrendingMovies } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    authorization: `Bearer ${API_KEY}`,
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [moviesList, setMoviesList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);

  // Debounce the search term to avoid too many API calls
  // This will wait for 500ms after the user stops typing before updating the search term
  // This is useful to reduce the number of requests sent to the API
  // and improve performance, especially when the user types quickly.
  // It uses the useDebounce hook from the 'react-use' library.
  // The second argument is the delay in milliseconds, and the third argument is the dependencies array.
  // In this case, it will update the debouncedSearchTerm whenever searchTerm changes.
  // This means that if the user types something, it will wait for 500ms after the last keystroke before updating the debouncedSearchTerm.
  // This helps to avoid sending too many requests to the API while the user is still typing.
  // The debouncedSearchTerm is then used to fetch the movies.
  // This is a common pattern in React applications to handle search inputs efficiently.
  useDebounce(() =>
    setDebouncedSearchTerm(searchTerm), 1000, [searchTerm]
  )

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');
    setMoviesList([]);

    try {
      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.response === 'false') {
        setErrorMessage(data.error || 'Failed to fetch movies');
        setMoviesList([]);
        return;
      }

      setMoviesList(data.results || []);
      // console.log(data.results);

      // If a search term is provided, update the search term in the database
      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {
      console.error('Error fetching movies:', error);
      setErrorMessage('Failed to fetch movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  }



  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    // Load trending movies when the component mounts
    loadTrendingMovies();
  }, [])



  return (
    <main>

      <div className='pattern' />

      <div className='wrapper'>

        <header>
          <img src="/hero.png" alt="Hero Banner" />
          <h1>Find <span className='text-gradient'> Movies </span> You'll Enjoy Without the Hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        </header>

        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}


        <section className='all-movies'>
          <h2 className=''>All Movies</h2>

          {/* {errorMessage && <p className='text-red-500'>{errorMessage}</p>} */}

          {isLoading ? (
            // <p className='text-white '>Loading...</p>
            <Spinner />
          ) : errorMessage ? (
            <p className='text-red-500'> {errorMessage} </p>
          ) : (
            <ul>
              {moviesList.map((movie) => (
                // <p key={movie.id} className='text-white'> {movie.title} </p>

                <MovieCard key={movie.id} movie={movie} />

              ))}
            </ul>
          )}

        </section>


      </div>

    </main>
  )
}

export default App