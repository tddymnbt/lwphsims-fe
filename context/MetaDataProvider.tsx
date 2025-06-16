import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface Category {
  code: string;
  name: string;
}
interface Brand {
  code: string;
  name: string;
}
interface Authenticator {
  code: string;
  name: string;
}

interface MetaDataContextType {
  categories: Category[];
  brands: Brand[];
  authenticators: Authenticator[];
  loading: boolean;
}

const MetaDataContext = createContext<MetaDataContextType>({
  categories: [],
  brands: [],
  authenticators: [],
  loading: true,
});

export function MetaDataProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [authenticators, setAuthenticators] = useState<Authenticator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeta() {
      setLoading(true);
      try {
        const [cat, br, auth] = await Promise.all([
          axios.get('https://lwphsims-uat.up.railway.app/products/categories'),
          axios.get('https://lwphsims-uat.up.railway.app/products/brands'),
          axios.get('https://lwphsims-uat.up.railway.app/products/authenticators'),
        ]);
        setCategories((cat.data.data || []).map((c: any) => ({ code: c.external_id, name: c.name })));
        setBrands((br.data.data || []).map((b: any) => ({ code: b.external_id, name: b.name })));
        setAuthenticators((auth.data.data || []).map((a: any) => ({ code: a.external_id, name: a.name })));
      } catch (e) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    }
    fetchMeta();
  }, []);

  return (
    <MetaDataContext.Provider value={{ categories, brands, authenticators, loading }}>
      {children}
    </MetaDataContext.Provider>
  );
}

export function useMetaData() {
  return useContext(MetaDataContext);
} 