import heapq

# Node class for Huffman Tree
class Node:
    def __init__(self, freq, symbol, left=None, right=None):
        self.freq = freq
        self.symbol = symbol
        self.left = left
        self.right = right

    # Define comparison for priority queue (heap)
    def __lt__(self, other):
        return self.freq < other.freq

# Function to build the Huffman Tree from frequency dictionary
def build_tree(frequency_dict):
    heap = [Node(freq, symbol) for symbol, freq in frequency_dict.items()]
    heapq.heapify(heap)

    while len(heap) > 1:
        node1 = heapq.heappop(heap)
        node2 = heapq.heappop(heap)
        merged = Node(node1.freq + node2.freq, '', node1, node2)
        heapq.heappush(heap, merged)

    return heap[0]

# Function to generate Huffman codes from the tree
def generate_codes(node, prefix='', code_map=None):
    if code_map is None:
        code_map = {}

    if node is None:
        return code_map

    if node.left is None and node.right is None:
        code_map[node.symbol] = prefix

    generate_codes(node.left, prefix + '0', code_map)
    generate_codes(node.right, prefix + '1', code_map)

    return code_map

# Optional: encode a string using the Huffman codes
def encode_string(data, code_map):
    return ''.join(code_map[char] for char in data)

# Optional: decode a Huffman-encoded string
def decode_string(encoded_str, root):
    decoded = ''
    current = root
    for bit in encoded_str:
        current = current.left if bit == '0' else current.right
        if current.left is None and current.right is None:
            decoded += current.symbol
            current = root
    return decoded
