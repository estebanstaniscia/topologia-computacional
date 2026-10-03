import gudhi
import networkx as nx


def test_gudhi_funciona():
    st = gudhi.SimplexTree()
    st.insert([0, 1, 2])
    assert st.num_vertices() == 3


def test_networkx_componentes():
    G = nx.Graph([(0, 1), (2, 3)])
    assert nx.number_connected_components(G) == 2
