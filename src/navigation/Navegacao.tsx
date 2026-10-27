import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icone, NomeIcone } from '../components/Icone';
import { useAuth } from '../context/AuthContext';
import { SincronizacaoProvider, useSincronizacao } from '../context/SincronizacaoContext';
import { cores } from '../theme';
import AcompanhamentoScreen from '../screens/AcompanhamentoScreen';
import CardapioScreen from '../screens/CardapioScreen';
import CarrinhoScreen from '../screens/CarrinhoScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import EnderecoFormScreen from '../screens/EnderecoFormScreen';
import EnderecosScreen from '../screens/EnderecosScreen';
import FavoritosScreen from '../screens/FavoritosScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import PedidosScreen from '../screens/PedidosScreen';
import PerfilScreen from '../screens/PerfilScreen';
import ProdutoScreen from '../screens/ProdutoScreen';
import RegistroScreen from '../screens/RegistroScreen';
import { AppStackParamList, AuthStackParamList, TabsParamList } from './tipos';

const tema = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: cores.fundo,
    card: cores.superficie,
    text: cores.texto,
    border: cores.borda,
    primary: cores.primaria,
  },
};

const opcoesCabecalho = {
  headerStyle: { backgroundColor: cores.superficie },
  headerShadowVisible: false,
  headerTintColor: cores.texto,
  headerTitleStyle: { fontWeight: '800' as const },
  contentStyle: { backgroundColor: cores.fundo },
};

// ---------- Fluxo sem login ----------

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function FluxoAutenticacao() {
  return (
    <AuthStack.Navigator screenOptions={opcoesCabecalho}>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Registro" component={RegistroScreen} options={{ title: 'Criar conta' }} />
    </AuthStack.Navigator>
  );
}

// ---------- Abas principais (após o login): Início | Cardápio | Pedidos | Perfil ----------

const Tabs = createBottomTabNavigator<TabsParamList>();

function icone(ativo: NomeIcone, inativo: NomeIcone) {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <Icone nome={focused ? ativo : inativo} cor={color} tamanho={24} />
  );
}

function Abas() {
  const { pendentes } = useSincronizacao();

  return (
    <Tabs.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda, paddingTop: 4 },
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="Inicio" component={HomeScreen} options={{ title: 'Início', tabBarIcon: icone('home', 'home-outline') }} />
      <Tabs.Screen name="Cardapio" component={CardapioScreen} options={{ title: 'Cardápio', tabBarIcon: icone('fast-food', 'fast-food-outline') }} />
      <Tabs.Screen
        name="Pedidos"
        component={PedidosScreen}
        options={{
          title: 'Pedidos',
          tabBarIcon: icone('receipt', 'receipt-outline'),
          tabBarBadge: pendentes.length > 0 ? pendentes.length : undefined,
          tabBarBadgeStyle: { backgroundColor: cores.alerta, color: '#FFFFFF' },
        }}
      />
      <Tabs.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil', tabBarIcon: icone('person', 'person-outline') }} />
    </Tabs.Navigator>
  );
}

const AppStack = createNativeStackNavigator<AppStackParamList>();

function FluxoApp() {
  return (
    <SincronizacaoProvider>
      <AppStack.Navigator screenOptions={opcoesCabecalho}>
        <AppStack.Screen name="Tabs" component={Abas} options={{ headerShown: false }} />
        <AppStack.Screen name="Produto" component={ProdutoScreen} options={{ headerShown: false }} />
        <AppStack.Screen name="Carrinho" component={CarrinhoScreen} options={{ title: 'Carrinho' }} />
        <AppStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Finalizar pedido' }} />
        <AppStack.Screen name="Acompanhamento" component={AcompanhamentoScreen} options={{ title: 'Acompanhar pedido' }} />
        <AppStack.Screen name="Enderecos" component={EnderecosScreen} options={{ title: 'Endereços' }} />
        <AppStack.Screen name="EnderecoForm" component={EnderecoFormScreen} options={{ title: 'Endereço' }} />
        <AppStack.Screen name="Favoritos" component={FavoritosScreen} options={{ title: 'Favoritos' }} />
      </AppStack.Navigator>
    </SincronizacaoProvider>
  );
}

// ---------- Raiz: escolhe o fluxo conforme a sessão ----------

export default function Navegacao() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={tema}>{usuario ? <FluxoApp /> : <FluxoAutenticacao />}</NavigationContainer>
  );
}
